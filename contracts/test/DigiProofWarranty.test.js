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
});
