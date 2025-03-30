'use client';

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '@/lib/web3/config';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { hardhat, sepolia } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  console.log("[DEBUG] Providers component rendering");
  
  // Create a client instance that preserves state
  const [queryClient] = useState(() => {
    console.log("[DEBUG] Creating new QueryClient");
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          refetchOnWindowFocus: false,
        },
      },
    });
  });

  // Debug logging for component updates
  useEffect(() => {
    console.log("[DEBUG] Providers mounted");
    
    return () => {
      console.log("[DEBUG] Providers unmounted");
    };
  }, []);

  // Set initial chain based on environment, default to Sepolia for production
  const initialChain = process.env.NODE_ENV === 'production' ? sepolia : hardhat;
  console.log("[DEBUG] Initial chain set to:", initialChain.name);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider initialChain={initialChain}>
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
} 