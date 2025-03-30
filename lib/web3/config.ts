import '@rainbow-me/rainbowkit/styles.css';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia } from 'viem/chains';
import { http } from 'viem';
import { ethers } from 'ethers';

// Get contract address from environment variable
export const STARTUP_FUNDING_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Debug log for contract address
console.log("[DEBUG] Using contract address:", STARTUP_FUNDING_ADDRESS);

// Network-specific contract addresses
export const CONTRACT_ADDRESSES = {
  [hardhat.id]: '0xD6A283Bc293D9e16dcdf86Bd42c73ce0a64F470B', // Default Hardhat address
  [sepolia.id]: process.env.NEXT_PUBLIC_SEPOLIA_CONTRACT_ADDRESS || STARTUP_FUNDING_ADDRESS
};

// Get the appropriate contract address for the current chain
export function getContractAddress(chainId?: number) {
  if (!chainId) return STARTUP_FUNDING_ADDRESS;
  
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || STARTUP_FUNDING_ADDRESS;
}

// Include both Hardhat and Sepolia for flexibility
const chains = process.env.NODE_ENV === 'production' ? [sepolia] : [hardhat, sepolia];

// Make sure we have a project ID for WalletConnect
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '1134494b277466ec431f65f12887f1a2';

// Create an HTTP transport with CORS headers for local development
const hardhatTransport = http('http://127.0.0.1:8545');
const sepoliaTransport = http();

export const wagmiConfig = getDefaultConfig({
  appName: 'Startup DAO',
  projectId, // Add the project ID here
  chains: chains as any,
  transports: {
    [hardhat.id]: hardhatTransport,
    [sepolia.id]: sepoliaTransport,
  },
});

// Get environment variables
const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID;
const walletConnectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID;

// Define chain settings for the app
export const chainConfig = {
  chainId: process.env.NEXT_PUBLIC_NETWORK_ID ? Number(process.env.NEXT_PUBLIC_NETWORK_ID) : 11155111, // Default to Sepolia
  name: 'Sepolia Testnet',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
};

// Import the contract ABI
import StartupFundingABI from '../../public/contracts/StartupFunding.sol/StartupFunding.json';

// Create the contract instance
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const contract = new ethers.Contract(getContractAddress(), StartupFundingABI.abi, provider); 