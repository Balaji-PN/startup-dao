import { ethers } from "hardhat";

async function main() {
  console.log("Deploying StartupFunding contract...");

  const startupFunding = await ethers.deployContract("StartupFunding");
  await startupFunding.waitForDeployment();

  const address = await startupFunding.getAddress();
  console.log(`StartupFunding deployed to: ${address}`);
  
  return { startupFunding, address };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 