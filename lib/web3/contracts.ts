import { STARTUP_FUNDING_ADDRESS } from './config';
import { parseEther } from 'viem';

// Import the contract ABI
import StartupFundingAbi from '../../blockchain/artifacts/contracts/StartupFunding.sol/StartupFunding.json';

// Export the contract ABI
export const STARTUP_FUNDING_ABI = StartupFundingAbi.abi;

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