import { STARTUP_FUNDING_ADDRESS, getContractAddress } from './config';
import { parseEther } from 'viem';

// Import the contract ABI - using the public directory for Vercel compatibility
// This is in case the blockchain/artifacts directory is gitignored
let STARTUP_FUNDING_ABI: any;

try {
  // Try importing from the original location first (for local development)
  console.log("[DEBUG] Attempting to load ABI from blockchain/artifacts...");
  const abi = require('../../blockchain/artifacts/contracts/StartupFunding.sol/StartupFunding.json');
  STARTUP_FUNDING_ABI = abi.abi;
  console.log("[DEBUG] Successfully loaded ABI from blockchain/artifacts");
} catch (error) {
  console.error('[DEBUG] Failed to load ABI from blockchain/artifacts:', error);
  // Fallback to the public directory (for production build)
  try {
    console.log("[DEBUG] Attempting to load ABI from public/contracts...");
    const abi = require('../../public/contracts/StartupFunding.sol/StartupFunding.json');
    STARTUP_FUNDING_ABI = abi.abi;
    console.log("[DEBUG] Successfully loaded ABI from public/contracts");
  } catch (secondError) {
    console.error('[DEBUG] Failed to load contract ABI from public/contracts:', secondError);
    // Provide a more complete fallback ABI
    console.log("[DEBUG] Using fallback ABI");
    STARTUP_FUNDING_ABI = [
      {
        "inputs": [],
        "name": "proposalCount",
        "outputs": [{"type": "uint256", "name": ""}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {"name": "_title", "type": "string"},
          {"name": "_description", "type": "string"},
          {"name": "_fundingGoal", "type": "uint256"},
          {"name": "_durationInDays", "type": "uint256"}
        ],
        "name": "createProposal",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "_proposalId", "type": "uint256"}],
        "name": "getProposal",
        "outputs": [
          {"name": "creator", "type": "address"},
          {"name": "title", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "fundingGoal", "type": "uint256"},
          {"name": "amountRaised", "type": "uint256"},
          {"name": "deadline", "type": "uint256"},
          {"name": "claimed", "type": "bool"},
          {"name": "active", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "_proposalId", "type": "uint256"}],
        "name": "contribute",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }
    ];
  }
}

// Export the contract ABI
export { STARTUP_FUNDING_ABI };

// Function to get the contract config for use with wagmi
export function getStartupFundingContract(chainId?: number) {
  const address = getContractAddress(chainId);
  console.log("[DEBUG] Creating contract config with address:", address);
  return {
    address: address as `0x${string}`,
    abi: STARTUP_FUNDING_ABI,
  };
}

// Helper functions for contract interactions
export async function formatProposalData(proposalData: any) {
  try {
    console.log("[DEBUG] Formatting proposal data:", proposalData);
    
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
  } catch (error) {
    console.error("[DEBUG] Error formatting proposal data:", error);
    return null;
  }
}

export function convertToWei(ethAmount: string): bigint {
  try {
    // Make sure ethAmount is a valid number
    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount <= 0) {
      console.error("[DEBUG] Invalid ETH amount:", ethAmount);
      throw new Error("Invalid ETH amount");
    }
    
    console.log("[DEBUG] Converting ETH amount to wei:", amount);
    return parseEther(amount.toString());
  } catch (error) {
    console.error("[DEBUG] Error converting to wei:", error);
    throw error;
  }
} 