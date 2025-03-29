import { http, createConfig } from 'wagmi';
import { sepolia, hardhat } from 'wagmi/chains';

// Use the hardhat chain in development, sepolia in production
const defaultChain = process.env.NODE_ENV === 'production' ? sepolia : hardhat;

// Get environment variables
const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID;
const walletConnectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID;

// Set up the wagmi config
export const config = createConfig({
  chains: [defaultChain],
  transports: {
    [defaultChain.id]: http(),
  },
});

// Contract address from environment
export const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Define chain settings for the app
export const chainConfig = {
  chainId: process.env.NEXT_PUBLIC_NETWORK_ID ? Number(process.env.NEXT_PUBLIC_NETWORK_ID) : 11155111, // Default to Sepolia
  name: 'Sepolia Testnet',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
}; 