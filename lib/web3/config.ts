import '@rainbow-me/rainbowkit/styles.css';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia } from 'viem/chains';
import { http } from 'viem';

export const STARTUP_FUNDING_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

// Use Hardhat local chain in development and Sepolia in production
const chains = process.env.NODE_ENV === 'production' ? [sepolia] : [hardhat];

export const wagmiConfig = getDefaultConfig({
  appName: 'Startup DAO',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
  transports: {
    [hardhat.id]: http(),
    [sepolia.id]: http(),
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