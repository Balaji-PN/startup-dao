import { contractAddress } from './config';

// Import the contract ABI
import StartupFundingAbi from '../../blockchain/artifacts/contracts/StartupFunding.sol/StartupFunding.json';

// Export the contract ABI
export const STARTUP_FUNDING_ABI = StartupFundingAbi.abi;

// Function to get the contract config for use with wagmi
export function getStartupFundingContract() {
  return {
    address: contractAddress as `0x${string}`,
    abi: STARTUP_FUNDING_ABI,
  };
} 