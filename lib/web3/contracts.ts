import { STARTUP_FUNDING_ADDRESS } from './config';
import { parseEther } from 'viem';

// Import the contract ABI - using the public directory for Vercel compatibility
// This is in case the blockchain/artifacts directory is gitignored
let STARTUP_FUNDING_ABI: any;

try {
  // Try importing from the original location first (for local development)
  const abi = require('../../blockchain/artifacts/contracts/StartupFunding.sol/StartupFunding.json');
  STARTUP_FUNDING_ABI = abi.abi;
} catch (error) {
  // Fallback to the public directory (for production build)
  try {
    const abi = require('../../public/contracts/StartupFunding.sol/StartupFunding.json');
    STARTUP_FUNDING_ABI = abi.abi;
  } catch (secondError) {
    console.error('Failed to load contract ABI', secondError);
    // Provide a minimal ABI as fallback (you should replace this with your actual ABI)
    STARTUP_FUNDING_ABI = [
      // Example ABI entries - replace with your actual functions
      {
        "inputs": [],
        "name": "proposalCount",
        "outputs": [{"type": "uint256", "name": ""}],
        "stateMutability": "view",
        "type": "function"
      },
      // Add more functions as needed
    ];
  }
}

// Export the contract ABI
export { STARTUP_FUNDING_ABI };

// Function to get the contract config for use with wagmi
export function getStartupFundingContract() {
  return {
    address: STARTUP_FUNDING_ADDRESS as `0x${string}`,
    abi: STARTUP_FUNDING_ABI,
  };
}

// Helper functions for contract interactions

export async function formatProposalData(proposalData: any) {
  const [
    creator,
    title,
    description,
    fundingGoal,
    amountRaised,
    deadline,
    claimed,
    active
  ] = proposalData;

  return {
    creator,
    title,
    description,
    fundingGoal: Number(fundingGoal) / 1e18, // Convert from wei to ETH
    amountRaised: Number(amountRaised) / 1e18, // Convert from wei to ETH
    deadline: new Date(Number(deadline) * 1000), // Convert from unix timestamp to JS Date
    claimed,
    active
  };
}

export function convertToWei(ethAmount: string): bigint {
  return parseEther(ethAmount);
} 