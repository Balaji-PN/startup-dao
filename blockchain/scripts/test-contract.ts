import { ethers } from "hardhat";

async function main() {
  console.log("Testing StartupFunding contract...");
  
  // Get the contract at the deployed address
  const contractAddress = "0xD6A283Bc293D9e16dcdf86Bd42c73ce0a64F470B";
  const StartupFunding = await ethers.getContractFactory("StartupFunding");
  const contract = await ethers.getContractAt("StartupFunding", contractAddress);
  
  // Check initial proposal count
  const initialCount = await contract.proposalCount();
  console.log(`Initial proposal count: ${initialCount}`);
  
  // Create a test proposal
  console.log("Creating a test proposal...");
  const tx = await contract.createProposal(
    "Test Proposal", 
    "This is a test proposal created from a script", 
    ethers.parseEther("5"), // 5 ETH funding goal
    30 // 30 days duration
  );
  
  const receipt = await tx.wait();
  console.log(`Proposal created with transaction hash: ${tx.hash}`);
  
  // Get proposal ID from the event
  const event = receipt?.logs[0];
  console.log("Event data:", event);
  
  // Check updated proposal count
  const updatedCount = await contract.proposalCount();
  console.log(`Updated proposal count: ${updatedCount}`);
  
  // Check each proposal
  console.log("\nChecking all proposals:");
  for (let i = 0; i < updatedCount; i++) {
    console.log(`\nProposal ID: ${i}`);
    try {
      const proposal = await contract.getProposal(i);
      console.log("Proposal details:", {
        creator: proposal[0],
        title: proposal[1],
        description: proposal[2],
        fundingGoal: ethers.formatEther(proposal[3]),
        amountRaised: ethers.formatEther(proposal[4]),
        deadline: new Date(Number(proposal[5]) * 1000).toISOString(),
        claimed: proposal[6],
        active: proposal[7]
      });
    } catch (error: any) {
      console.error(`Error fetching proposal ${i}:`, error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 