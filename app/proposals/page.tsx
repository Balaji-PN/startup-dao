'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Navigation from '@/components/Navigation';
import { useStartupFundingContract } from '@/lib/web3/useContract';
import LoadingSpinner from '@/components/LoadingSpinner';
import { STARTUP_FUNDING_ADDRESS } from '@/lib/web3/config';

type Proposal = {
  id: number;
  title: string;
  description: string;
  fundingGoal: number;
  amountRaised: number;
  deadline: Date;
  active: boolean;
  claimed: boolean;
};

// Sample proposals for demo purposes
const SAMPLE_PROPOSALS: Proposal[] = [
  {
    id: 1,
    title: 'AI-Powered Healthcare Analytics',
    description: 'Using AI to improve patient outcomes and reduce costs.',
    fundingGoal: 15,
    amountRaised: 8.5,
    deadline: new Date('2025-03-15'),
    active: true,
    claimed: false
  },
  {
    id: 2,
    title: 'Decentralized Renewable Energy Platform',
    description: 'P2P energy trading using blockchain technology.',
    fundingGoal: 10,
    amountRaised: 10,
    deadline: new Date('2025-02-01'),
    active: true,
    claimed: false
  },
  {
    id: 3,
    title: 'Smart Agriculture Solutions',
    description: 'IoT sensors and data analytics for precision farming.',
    fundingGoal: 8,
    amountRaised: 2.3,
    deadline: new Date('2025-04-30'),
    active: true,
    claimed: false
  }
];

export default function Proposals() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSampleData, setShowSampleData] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [lastCount, setLastCount] = useState<number | null>(null);

  const { 
    getProposal, 
    proposalCount, 
    refetchProposalCount,
    getProposalCount,
    error: contractError,
    isContractVerified,
    chainId
  } = useStartupFundingContract();

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    console.log("[DEBUG] Manual refresh triggered");
    setIsLoading(true);
    await refetchProposalCount?.();
    await loadProposals(true);
  }, [refetchProposalCount]);

  // Load proposals only when proposalCount changes
  const loadProposals = useCallback(async (isRefresh = false) => {
    const now = Date.now();
    const currentCount = proposalCount ? Number(proposalCount) : 0;

    // Skip fetching if we recently fetched and it's not a manual refresh
    // and the count hasn't changed
    if (!isRefresh 
        && lastFetchTime 
        && lastCount === currentCount
        && now - lastFetchTime < 10000) { // 10 seconds cache
      console.log("[DEBUG] Using cached proposal data - last fetch was", (now - lastFetchTime) / 1000, "seconds ago");
      return;
    }

    if (!isRefresh) setIsLoading(true);
    setLoadError(null);
    
    try {
      // Check if the contract is verified first
      if (isContractVerified === false) {
        console.error("[DEBUG] Contract not verified, using sample data");
        setProposals(SAMPLE_PROPOSALS);
        setShowSampleData(true);
        setLoadError("Contract not found at the specified address. Using sample data for demonstration.");
        return;
      }
      
      // First try to get the count directly as a fallback
      const directCount = await getProposalCount();
      const count = proposalCount !== undefined ? Number(proposalCount) : directCount;
      
      console.log("[DEBUG] Loading proposals, hook count:", proposalCount, "direct count:", directCount, "using:", count);
      
      // Set this as our last count
      setLastCount(count);
      
      // If we have proposals from the contract
      if (count > 0) {
        const fetchedProposals: Proposal[] = [];
        
        // Fetch each proposal by ID
        for (let i = 0; i < count; i++) {
          try {
            console.log(`[DEBUG] Fetching proposal ID: ${i}`);
            const proposal = await getProposal(BigInt(i));
            console.log(`[DEBUG] Proposal ${i} data:`, proposal);
            
            if (proposal) {
              fetchedProposals.push({
                id: i,
                ...proposal
              });
            }
          } catch (error) {
            // Silent error for individual proposals
            console.error(`[DEBUG] Error fetching proposal ${i}:`, error);
          }
        }
        
        console.log("[DEBUG] Fetched proposals:", fetchedProposals);
        
        if (fetchedProposals.length > 0) {
          setProposals(fetchedProposals);
          setShowSampleData(false);
          // Update last fetch time
          setLastFetchTime(now);
          return;
        } else {
          console.log("[DEBUG] No proposals fetched despite positive count. Using sample data.");
        }
      } else {
        console.log("[DEBUG] No proposals found (count: " + count + ")");
      }
      
      // For demo purposes, add some sample proposals if none are found from the contract
      console.log("[DEBUG] Using sample data");
      setProposals(SAMPLE_PROPOSALS);
      setShowSampleData(true);
      // Update last fetch time even for sample data
      setLastFetchTime(now);
    } catch (error: any) {
      console.error("[DEBUG] Error loading proposals:", error);
      setLoadError(error.message || contractError || 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  // Include only stable dependencies that won't change often
  }, [lastFetchTime, lastCount, proposalCount, contractError, getProposal, getProposalCount, isContractVerified]);

  // Call loadProposals when proposalCount changes or when isContractVerified changes
  useEffect(() => {
    // Skip if we're still verifying the contract
    if (isContractVerified === null) return;
    
    // Add a flag to track if this effect is already running
    let isEffectRunning = false;
    
    const fetchData = async () => {
      if (isEffectRunning) return;
      isEffectRunning = true;
      
      console.log(`[DEBUG] Proposals useEffect triggered - isContractVerified: ${isContractVerified}, proposalCount: ${proposalCount}`);
      await loadProposals();
      
      isEffectRunning = false;
    };
    
    fetchData();
  }, [isContractVerified, proposalCount]);
  
  // Only fetch proposal count when the component mounts
  useEffect(() => {
    console.log("[DEBUG] Initial proposals page load - fetching proposal count");
    refetchProposalCount?.();
    // We don't include refetchProposalCount in dependencies to prevent loops
  }, []);

  return (
    <main className="min-h-screen bg-app">
      <Navigation />
      
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Startup Proposals</h1>
              {chainId && (
                <div className="text-sm text-gray-500 mt-1">
                  Network: {chainId === 11155111 ? 'Sepolia Testnet' : chainId === 31337 ? 'Hardhat Local' : `Unknown (${chainId})`}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="btn-secondary px-4 py-2 rounded-md flex items-center"
                title="Refresh proposals"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={() => router.push('/proposals/create')}
                className="btn-primary px-4 py-2 rounded-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Proposal
              </button>
            </div>
          </div>
          
          {showSampleData && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p>Showing sample proposals for demonstration. Create your own proposal to see it listed here.</p>
              </div>
            </div>
          )}
          
          {isContractVerified === false && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Contract Not Found</p>
                  <p className="text-sm mt-1">The contract was not found at address {STARTUP_FUNDING_ADDRESS}. Make sure you have deployed your contract and are on the correct network.</p>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="bg-card rounded-lg p-6 text-center">
              <LoadingSpinner size="large" className="mb-4" />
              <p className="text-primary">Loading proposals...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4 my-4">
              <p>{loadError}</p>
              <button 
                onClick={() => handleRefresh()}
                className="mt-2 text-red-800 dark:text-red-400 underline"
              >
                Try Again
              </button>
            </div>
          ) : proposals.length === 0 ? (
            <div className="bg-card rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium text-primary mb-2">No Proposals Yet</h3>
              <p className="text-secondary mb-6">Be the first to create a startup funding proposal!</p>
              <button
                onClick={() => router.push('/proposals/create')}
                className="btn-primary px-4 py-2 rounded-md"
              >
                Create Proposal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((proposal) => {
                const progressPercentage = Math.min(100, Math.round((proposal.amountRaised / proposal.fundingGoal) * 100));
                const isFullyFunded = proposal.amountRaised >= proposal.fundingGoal;
                const isExpired = new Date() > proposal.deadline;
                
                return (
                  <div 
                    key={proposal.id} 
                    className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-lg font-medium text-primary line-clamp-1">{proposal.title}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isFullyFunded 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                            : isExpired
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}>
                          {isFullyFunded ? 'FUNDED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                        </span>
                      </div>
                      
                      <p className="text-secondary mb-4 line-clamp-2">{proposal.description.split('\n')[0]}</p>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1 text-secondary">
                          <span>{progressPercentage}% Funded</span>
                          <span>{proposal.amountRaised} / {proposal.fundingGoal} ETH</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${isFullyFunded ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-500'}`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-muted">
                        <span>Deadline: {proposal.deadline.toLocaleDateString()}</span>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-color">
                        <Link 
                          href={`/proposals/${proposal.id}`}
                          className="btn-secondary w-full py-2 text-center rounded-md block"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 