const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DigiProofWarranty", function () {
  it("mints, reads back, and transfers a warranty token", async function () {
    const [owner, buyer, newOwner] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("DigiProofWarranty");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();

    const tx = await contract.mintWarranty(buyer.address, "ipfs://cid-1");
    await tx.wait();

    expect(await contract.totalSupply()).to.equal(1n);
    expect(await contract.ownerOf(0)).to.equal(buyer.address);
    expect(await contract.tokenURI(0)).to.equal("ipfs://cid-1");

    await expect(
      contract.connect(buyer).mintWarranty(buyer.address, "ipfs://cid-2")
    ).to.be.revertedWith("Not an authorized minter");

    await contract
      .connect(buyer)
      .safeTransferFrom(buyer.address, newOwner.address, 0);
    expect(await contract.ownerOf(0)).to.equal(newOwner.address);
  });

  describe("adminTransfer", function () {
    async function mintedToBuyer() {
      const [owner, buyer, newOwner, stranger] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("DigiProofWarranty");
      const contract = await Factory.deploy();
      await contract.waitForDeployment();
      await (await contract.mintWarranty(buyer.address, "ipfs://cid-1")).wait();
      return { contract, owner, buyer, newOwner, stranger };
    }

    it("lets the minter move a token out of a customer's wallet without their approval", async function () {
      const { contract, owner, buyer, newOwner } = await mintedToBuyer();

      await expect(contract.connect(owner).adminTransfer(buyer.address, newOwner.address, 0))
        .to.emit(contract, "Transfer")
        .withArgs(buyer.address, newOwner.address, 0);
      expect(await contract.ownerOf(0)).to.equal(newOwner.address);
      // The token's metadata travels with it.
      expect(await contract.tokenURI(0)).to.equal("ipfs://cid-1");
    });

    it("works for any authorised minter, not only the deployer", async function () {
      const { contract, owner, buyer, newOwner, stranger } = await mintedToBuyer();

      await contract.connect(owner).setMinter(stranger.address, true);
      await contract.connect(stranger).adminTransfer(buyer.address, newOwner.address, 0);
      expect(await contract.ownerOf(0)).to.equal(newOwner.address);
    });

    it("refuses callers who are not authorised minters", async function () {
      const { contract, buyer, newOwner, stranger } = await mintedToBuyer();

      await expect(
        contract.connect(stranger).adminTransfer(buyer.address, stranger.address, 0)
      ).to.be.revertedWith("Not an authorized minter");
      // Even the holder can't use it; they have the normal ERC-721 transfer.
      await expect(
        contract.connect(buyer).adminTransfer(buyer.address, newOwner.address, 0)
      ).to.be.revertedWith("Not an authorized minter");
      expect(await contract.ownerOf(0)).to.equal(buyer.address);
    });

    it("rejects a 'from' that is not the current holder", async function () {
      const { contract, owner, buyer, newOwner, stranger } = await mintedToBuyer();

      await expect(contract.connect(owner).adminTransfer(stranger.address, newOwner.address, 0))
        .to.be.revertedWithCustomError(contract, "ERC721IncorrectOwner")
        .withArgs(stranger.address, 0, buyer.address);
      expect(await contract.ownerOf(0)).to.equal(buyer.address);
    });

    it("rejects a token that does not exist", async function () {
      const { contract, owner, buyer, newOwner } = await mintedToBuyer();

      await expect(contract.connect(owner).adminTransfer(buyer.address, newOwner.address, 99))
        .to.be.revertedWithCustomError(contract, "ERC721NonexistentToken")
        .withArgs(99);
    });

    it("stops working for a minter whose permission is removed", async function () {
      const { contract, owner, buyer, newOwner, stranger } = await mintedToBuyer();

      await contract.connect(owner).setMinter(stranger.address, true);
      await contract.connect(owner).setMinter(stranger.address, false);
      await expect(
        contract.connect(stranger).adminTransfer(buyer.address, newOwner.address, 0)
      ).to.be.revertedWith("Not an authorized minter");
    });
  });
});
