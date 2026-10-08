const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(signer.address);
  console.log("Address:", signer.address);
  // Amoy pays gas in POL, Sepolia (and other Ethereum networks) in ETH.
  const currency = hre.network.name === "amoy" ? "POL" : "ETH";
  console.log("Balance:", hre.ethers.formatEther(balance), currency, `(${hre.network.name})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
