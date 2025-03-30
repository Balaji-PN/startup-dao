import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { getStartupFundingContract, convertToWei, formatProposalData } from './contracts';
import { useState, useCallback, useEffect } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from './config';
import { hardhat, sepolia } from 'viem/chains';

export function useStartupFundingContract() {
  const { address, isConnected, chainId } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContractVerified, setIsContractVerified] = useState<boolean | null>(null);

  // Get contract config for the current chain
  const contract = getStartupFundingContract(chainId);
  const { writeContractAsync } = useWriteContract();
  
  // Check if the contract exists on the current chain
  useEffect(() => {
    const verifyContract = async () => {
      if (!contract.address || !chainId) return;
      
      try {
        console.log("[DEBUG] Verifying contract exists at address:", contract.address);
        
        // Determine which chain we're on to provide better logging
        const networkName = chainId === hardhat.id ? "Hardhat" : 
                            chainId === sepolia.id ? "Sepolia" : 
                            "Unknown";
        console.log(`[DEBUG] Current network: ${networkName} (${chainId})`);
        
        // Skip the API call for local networks
        if (chainId === hardhat.id) {
          console.log("[DEBUG] Skipping contract verification for local Hardhat network");
          setIsContractVerified(true);
          setError(null);
          return;
        }
        
        // For Sepolia, do an actual verification
        if (chainId === sepolia.id) {
          // Cache the result to prevent multiple API calls
          const cacheKey = `contract-verified-${contract.address}-${chainId}`;
          const cached = sessionStorage.getItem(cacheKey);
          
          if (cached) {
            const result = cached === 'true';
            console.log(`[DEBUG] Using cached contract verification: ${result}`);
            setIsContractVerified(result);
            if (!result) {
              setError(`No contract found at ${contract.address} on ${networkName}`);
            } else {
              setError(null);
            }
            return;
          }
          
          // Only make the API call if we don't have a cached result
          try {
            const hasCode = await fetch(`https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getCode&address=${contract.address}&tag=latest`)
              .then(res => res.json())
              .then(data => data.result !== "0x");
            
            console.log("[DEBUG] Contract has code:", hasCode);
            setIsContractVerified(hasCode);
            
            // Cache the result
            sessionStorage.setItem(cacheKey, hasCode.toString());
            
            if (!hasCode) {
              setError(`No contract found at ${contract.address} on ${networkName}`);
            } else {
              setError(null);
            }
          } catch (apiError) {
            console.error("[DEBUG] API call failed, assuming contract exists for now");
            setIsContractVerified(true);
            setError(null);
          }
        }
      } catch (err) {
        console.error("[DEBUG] Error verifying contract:", err);
        setIsContractVerified(false);
        setError("Failed to verify contract existence");
      }
    };
    
    verifyContract();
  }, [contract.address, chainId]);
  
  // Get proposal count
  const { data: proposalCount, refetch: refetchProposalCount } = useReadContract({
    ...contract,
    functionName: 'proposalCount',
    query: {
      enabled: isContractVerified === true, // Only enable when contract is verified
    }
  });

  // Create a type for our function with the isRunning property
  type AsyncFunctionWithFlag = {
    (): Promise<number>;
    isRunning: boolean;
    lastResult?: number;
    lastFetchTime?: number;
  };

  // Get proposal count directly (as a fallback)
  const getProposalCount = useCallback(async () => {
    // Check cache first (only use cache for 10 seconds)
    const now = Date.now();
    const cachedResult = (getProposalCount as AsyncFunctionWithFlag).lastResult;
    const lastFetch = (getProposalCount as AsyncFunctionWithFlag).lastFetchTime || 0;
    
    // Use cached value if available and fresh
    if (cachedResult !== undefined && now - lastFetch < 10000) {
      console.log("[DEBUG] Using cached proposal count:", cachedResult);
      return cachedResult;
    }
    
    // Add a flag to prevent multiple simultaneous calls
    if ((getProposalCount as AsyncFunctionWithFlag).isRunning) {
      console.log("[DEBUG] getProposalCount already running, skipping duplicate call");
      return cachedResult || 0; // Return cached value if available
    }

    try {
      (getProposalCount as AsyncFunctionWithFlag).isRunning = true;
      
      if (isContractVerified === false) {
        console.error("[DEBUG] Cannot get proposal count, contract not verified");
        return 0;
      }

      // For Hardhat, just return a default value to avoid errors
      if (chainId === hardhat.id) {
        console.log("[DEBUG] Using default proposal count for Hardhat network");
        return 0;
      }
      
      console.log("[DEBUG] Getting proposal count directly...");
      const count = await readContract(wagmiConfig, {
        ...contract,
        functionName: 'proposalCount',
        args: []
      });
      console.log("[DEBUG] Direct proposal count:", count);
      
      // Store in cache
      const result = count ? Number(count) : 0;
      (getProposalCount as AsyncFunctionWithFlag).lastResult = result;
      (getProposalCount as AsyncFunctionWithFlag).lastFetchTime = now;
      
      return result;
    } catch (err: any) {
      console.error("[DEBUG] Error getting proposal count:", err);
      
      // Check for specific error types
      if (err.message && err.message.includes("returned no data")) {
        console.error("[DEBUG] Contract might not exist or not have the proposalCount function");
      }
      
      return (getProposalCount as AsyncFunctionWithFlag).lastResult || 0;
    } finally {
      (getProposalCount as AsyncFunctionWithFlag).isRunning = false;
    }
  }, [contract, isContractVerified, chainId]);

  // Add running flag and cache to the function
  (getProposalCount as AsyncFunctionWithFlag).isRunning = false;
  (getProposalCount as AsyncFunctionWithFlag).lastResult = undefined;
  (getProposalCount as AsyncFunctionWithFlag).lastFetchTime = 0;

  // Create a new proposal
  const createProposal = useCallback(async (
    title: string,
    description: string,
    fundingGoalEth: string,
    durationInDays: number
  ) => {
    console.log("[DEBUG] createProposal called with:", { title, description, fundingGoalEth, durationInDays });
    
    if (!isConnected) {
      console.error("[DEBUG] Wallet not connected");
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[DEBUG] Converting funding goal to wei:", fundingGoalEth);
      const fundingGoalWei = convertToWei(fundingGoalEth);
      console.log("[DEBUG] Funding goal in wei:", fundingGoalWei.toString());
      
      console.log("[DEBUG] Preparing contract call with args:", [title, description, fundingGoalWei, BigInt(durationInDays)]);
      console.log("[DEBUG] Contract address:", contract.address);
      console.log("[DEBUG] Signer address:", address);
      
      console.log("[DEBUG] Awaiting writeContractAsync...");
      
      const hash = await writeContractAsync({
        ...contract,
        functionName: 'createProposal',
        args: [title, description, fundingGoalWei, BigInt(durationInDays)],
      });
      
      console.log("[DEBUG] Transaction hash:", hash);
      
      // Wait for transaction receipt to ensure it's mined
      console.log("[DEBUG] Transaction sent! Waiting for confirmation...");
      
      // Return hash even before confirmation for better UX
      return hash;
    } catch (err: any) {
      console.error("[DEBUG] Error in createProposal:", err);
      // Add more detailed error information
      if (err.shortMessage) console.error("[DEBUG] Short message:", err.shortMessage);
      if (err.cause) console.error("[DEBUG] Cause:", err.cause);
      if (err.details) console.error("[DEBUG] Details:", err.details);
      
      setError(err.message || 'Failed to create proposal');
      return null;
    } finally {
      console.log("[DEBUG] createProposal function completed execution");
      setIsLoading(false);
    }
  }, [contract, writeContractAsync, isConnected, address]);

  // Contribute to a proposal
  const contributeToProposal = useCallback(async (
    proposalId: bigint,
    amountEth: string
  ) => {
    if (!isConnected) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const amountWei = convertToWei(amountEth);
      const hash = await writeContractAsync({
        ...contract,
        functionName: 'contribute',
        args: [proposalId],
        value: amountWei,
      });
      
      return hash;
    } catch (err: any) {
      setError(err.message || 'Failed to contribute');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contract, writeContractAsync, isConnected]);

  // Get proposal by ID
  const getProposal = useCallback(async (proposalId: bigint) => {
    console.log(`[DEBUG] Getting proposal for ID: ${proposalId}`);
    
    // Check the cache for this proposal
    const cacheKey = `proposal-${chainId}-${contract.address}-${proposalId}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      try {
        const parsedData = JSON.parse(cached);
        // Make sure to convert the deadline back to a Date object
        parsedData.deadline = new Date(parsedData.deadline);
        console.log(`[DEBUG] Using cached data for proposal ${proposalId}`);
        return parsedData;
      } catch (e) {
        console.error(`[DEBUG] Error parsing cached proposal:`, e);
        // Continue to fetch if cache parsing fails
      }
    }
    
    try {
      if (isContractVerified === false) {
        console.error("[DEBUG] Cannot get proposal, contract not verified");
        return null;
      }

      // For Hardhat, return sample data for quick development
      if (chainId === hardhat.id && Number(proposalId) >= Number(proposalCount || 0)) {
        console.log(`[DEBUG] Using sample data for proposal ${proposalId} on Hardhat`);
        const sampleData = {
          creator: address || "0x0",
          title: `Test Proposal ${proposalId}`,
          description: "This is a test proposal for local development",
          fundingGoal: 10,
          amountRaised: 2.5,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          claimed: false,
          active: true
        };
        
        // Cache the sample data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          ...sampleData,
          deadline: sampleData.deadline.toISOString(), // Store as string for JSON
        }));
        
        return sampleData;
      }
      
      console.log(`[DEBUG] Fetching proposal data for ID: ${proposalId}`);
      const data = await readContract(wagmiConfig, {
        ...contract,
        functionName: 'getProposal',
        args: [proposalId]
      }) as [string, string, string, bigint, bigint, bigint, boolean, boolean];
      
      console.log(`[DEBUG] Raw proposal data:`, data);
      
      if (data) {
        // Format the proposal data properly
        const formattedData = {
          creator: data[0],
          title: data[1],
          description: data[2],
          fundingGoal: Number(data[3]) / 1e18, // Convert from wei to ETH
          amountRaised: Number(data[4]) / 1e18, // Convert from wei to ETH
          deadline: new Date(Number(data[5]) * 1000), // Convert from unix timestamp to JS Date
          claimed: data[6],
          active: data[7]
        };
        
        // Cache the formatted data
        sessionStorage.setItem(cacheKey, JSON.stringify({
          ...formattedData,
          deadline: formattedData.deadline.toISOString(), // Store as string for JSON
        }));
        
        return formattedData;
      }
      
      return null;
    } catch (err: any) {
      console.error(`[DEBUG] Error getting proposal ${proposalId}:`, err);
      return null;
    }
  }, [contract, proposalCount, isContractVerified, chainId, address]);

  // Return stable values
  return {
    isLoading,
    error,
    isContractVerified,
    proposalCount: proposalCount ? Number(proposalCount) : 0,
    refetchProposalCount,
    createProposal,
    contributeToProposal,
    getProposal,
    getProposalCount,
    chainId,
  };
}