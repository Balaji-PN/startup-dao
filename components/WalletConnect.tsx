import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Log connection status for debugging
  useEffect(() => {
    if (mounted) {
      console.log("[DEBUG] Wallet connection status:", isConnected ? "Connected" : "Disconnected");
      if (isConnected && address) {
        console.log("[DEBUG] Connected wallet address:", address);
      }
    }
  }, [isConnected, address, mounted]);

  // Display nothing until client-side rendering is complete
  if (!mounted) return null;

  // Use RainbowKit's ConnectButton to properly handle authentication
  return <ConnectButton />;
} 