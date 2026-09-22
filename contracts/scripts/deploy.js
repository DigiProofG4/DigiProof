const hre = require("hardhat");

async function main() {
  const DigiProofWarranty = await hre.ethers.getContractFactory("DigiProofWarranty");
  const contract = await DigiProofWarranty.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const [deployer] = await hre.ethers.getSigners();

  console.log("DigiProofWarranty deployed to:", address);
  console.log("Deployer / custodial wallet:", deployer.address);
  console.log(
    "authorizedMinters[deployer] =",
    await contract.authorizedMinters(deployer.address)
  );
  console.log("\nAdd to api/.env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
