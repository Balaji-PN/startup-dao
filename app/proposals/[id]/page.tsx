'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Navigation from '@/components/Navigation';
import { useStartupFundingContract } from '@/lib/web3/useContract';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProposalDetail() {
  const router = useRouter();
  const { id } = useParams();
  const { isConnected } = useAccount();
  const [contributionAmount, setContributionAmount] = useState('');
  const [isFunding, setIsFunding] = useState(false);
  const [fundingError, setFundingError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingRef = useRef(false);
  
  const { 
    contributeToProposal, 
    getProposal, 
    isLoading: contractLoading, 
    error: contractError,
    chainId
  } = useStartupFundingContract();

  // Memoize the loadProposal function to avoid recreating it on each render
  const loadProposal = useCallback(async () => {
    if (!id) {
      console.log("[DEBUG] No ID found, skipping loadProposal");
      return;
    }
    
    // Prevent multiple concurrent calls
    if (isLoadingRef.current) {
      console.log("[DEBUG] Already loading proposal, skipping duplicate call");
      return;
    }
    
    // Check if we have recent data in cached state
    const cacheKey = `proposal-detail-${id}`;
    const cached = sessionStorage.getItem(cacheKey);
    const now = Date.now();
    
    // Use cached data if it exists and is less than 30 seconds old
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (now - timestamp < 30000) { // 30 seconds cache
          console.log("[DEBUG] Using cached proposal data from sessionStorage");
          if (data.deadline) {
            data.deadline = new Date(data.deadline);
          }
          setProposal(data);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("[DEBUG] Error parsing cached proposal data:", e);
      }
    }
    
    console.log("[DEBUG] Starting to load proposal with ID:", id);
    
    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      console.log("[DEBUG] Calling getProposal with ID:", id.toString());
      const proposalData = await getProposal(BigInt(id.toString()));
      
      if (proposalData) {
        console.log("[DEBUG] Proposal data loaded successfully:", proposalData);
        setProposal(proposalData);
        
        // Cache the data
        const cacheData = {
          data: {...proposalData, deadline: proposalData.deadline.toISOString()},
          timestamp: now
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } else {
        console.log("[DEBUG] No proposal data returned, using fallback data");
        
        // Check if we're looking at a sample proposal (ID 1-3)
        const proposalId = parseInt(id.toString());
        if (proposalId >= 1 && proposalId <= 3) {
          const sampleData = {
            creator: '0x1234567890abcdef1234567890abcdef12345678',
            title: proposalId === 1 ? 'AI-Powered Healthcare Analytics' : 
                  proposalId === 2 ? 'Decentralized Renewable Energy Platform' :
                  'Smart Agriculture Solutions',
            description: `Sample proposal description for demo purposes.\n\nStartup: ${proposalId === 1 ? 'HealthTech AI' : 
                         proposalId === 2 ? 'EnergyChain' : 
                         'AgriTech Solutions'}\nWebsite: https://example.com`,
            fundingGoal: proposalId === 1 ? 15 : proposalId === 2 ? 10 : 8,
            amountRaised: proposalId === 1 ? 8.5 : proposalId === 2 ? 10 : 2.3,
            deadline: new Date(proposalId === 1 ? '2025-03-15' : proposalId === 2 ? '2025-02-01' : '2025-04-30'),
            claimed: false,
            active: true
          };
          setProposal(sampleData);
          
          // Cache sample data too
          const cacheData = {
            data: {...sampleData, deadline: sampleData.deadline.toISOString()},
            timestamp: now
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } else {
          // If not a sample proposal and no data, set proposal to null
          setProposal(null);
        }
      }
    } catch (error) {
      console.error('[DEBUG] Error loading proposal:', error);
      setProposal(null);
    } finally {
      console.log("[DEBUG] Finished loading proposal, setting isLoading to false");
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [id]);

  // Load proposal data
  useEffect(() => {
    console.log("[DEBUG] ProposalDetail useEffect for loading proposal triggered");
    
    // Avoid multiple concurrent calls
    let isActive = true;
    
    const fetchData = async () => {
      if (isActive) {
        await loadProposal();
      }
    };
    
    fetchData();
    
    return () => {
      isActive = false;
      console.log("[DEBUG] ProposalDetail proposal loading effect cleanup");
    };
  }, [id]); // Only depend on id, not loadProposal

  // Handle contribution form submission
  const handleContribute = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    // Input validation
    if (!id) {
      setFundingError('Invalid proposal ID');
      return;
    }
    
    if (!contributionAmount) {
      setFundingError('Please enter a contribution amount');
      return;
    }
    
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      setFundingError('Please enter a valid contribution amount');
      return;
    }
    
    // Proposal validation
    if (!proposal || !proposal.active) {
      setFundingError('This proposal is not active');
      return;
    }
    
    if (new Date() > proposal.deadline) {
      setFundingError('This proposal has expired');
      return;
    }
    
    try {
      console.log("[DEBUG] Starting contribution process with amount:", contributionAmount);
      setIsFunding(true);
      setFundingError(null);
      
      const txHash = await contributeToProposal(
        BigInt(id.toString()),
        contributionAmount
      );
      
      console.log("[DEBUG] Contribution transaction result:", txHash);
      
      if (txHash) {
        console.log('[DEBUG] Transaction successful:', txHash);
        setContributionAmount('');
        
        // Update the proposal data optimistically
        if (proposal) {
          console.log('[DEBUG] Updating proposal with new contribution amount');
          const updatedProposal = {
            ...proposal,
            amountRaised: proposal.amountRaised + amount
          };
          setProposal(updatedProposal);
          
          // Update the cache with the new data
          const cacheKey = `proposal-detail-${id}`;
          const cacheData = {
            data: {
              ...updatedProposal,
              deadline: updatedProposal.deadline.toISOString()
            },
            timestamp: Date.now()
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        }
        
        // Clear proposal cache after 15 seconds to ensure a fresh reload on next visit
        setTimeout(() => {
          console.log('[DEBUG] Clearing proposal cache to ensure fresh data on next load');
          const cacheKey = `proposal-detail-${id}`;
          sessionStorage.removeItem(cacheKey);
          
          // Also clear proposal from contracts cache
          const contractCacheKey = `proposal-${chainId}-${id}`;
          sessionStorage.removeItem(contractCacheKey);
        }, 15000);
      } else {
        console.error('[DEBUG] Transaction failed, no hash returned');
        setFundingError(contractError || 'Transaction failed. Please try again.');
      }
    } catch (error: any) {
      console.error('[DEBUG] Error contributing to proposal:', error);
      setFundingError(error.message || 'Failed to contribute. Please try again.');
    } finally {
      setIsFunding(false);
    }
  }, [id, proposal, contributionAmount, isConnected, contributeToProposal, contractError, chainId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-app">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-card rounded-lg p-6 text-center">
            <LoadingSpinner size="large" className="mb-4" />
            <p className="text-primary">Loading proposal details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!proposal) {
    return (
      <main className="min-h-screen bg-app">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-card rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-primary">Proposal Not Found</h2>
            <p className="mb-4 text-secondary">The requested proposal does not exist or could not be loaded.</p>
            <button
              onClick={() => router.push('/proposals')}
              className="btn-primary px-4 py-2 rounded-md"
            >
              Back to Proposals
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Calculate funding progress
  const progressPercentage = Math.min(100, Math.round((proposal.amountRaised / proposal.fundingGoal) * 100));
  const isFullyFunded = proposal.amountRaised >= proposal.fundingGoal;
  const isExpired = new Date() > proposal.deadline;
  const canContribute = !isExpired && proposal.active && !isFullyFunded;

  return (
    <main className="min-h-screen bg-app">
      <Navigation />
      
      <div className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/proposals')}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Proposals
              </button>
            </div>
            <div>
              <span className={`text-sm px-2 py-1 rounded-full ${
                isFullyFunded 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                  : isExpired
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
              }`}>
                {isFullyFunded ? 'FUNDED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
              </span>
            </div>
          </div>
          
          <div className="bg-card rounded-lg overflow-hidden">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-primary mb-2">{proposal.title}</h1>
              
              <div className="mb-4 text-secondary whitespace-pre-line">{proposal.description}</div>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1 text-secondary">
                  <span>Progress: {progressPercentage}%</span>
                  <span>{proposal.amountRaised} ETH / {proposal.fundingGoal} ETH</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${isFullyFunded ? 'bg-green-600 dark:bg-green-500' : 'bg-blue-600 dark:bg-blue-500'}`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-muted mb-1">Creator</h3>
                  <p className="text-primary text-sm font-mono truncate">{proposal.creator}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted mb-1">Deadline</h3>
                  <p className="text-primary">{proposal.deadline.toLocaleDateString()}</p>
                </div>
              </div>
              
              {canContribute && isConnected && (
                <div className="mt-8 border-t border-color pt-6">
                  <h2 className="text-lg font-medium text-primary mb-4">Contribute to this Project</h2>
                  
                  {fundingError && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
                      {fundingError}
                    </div>
                  )}
                  
                  <form onSubmit={handleContribute} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1">
                        Amount (ETH)
                      </label>
                      <div className="flex">
                        <input
                          type="number"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          min="0.01"
                          step="0.01"
                          required
                          className="block w-full rounded-l-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={isFunding || contractLoading}
                          className={`btn-primary px-4 py-2 rounded-r-md ${
                            (isFunding || contractLoading) ? 'opacity-75 cursor-not-allowed' : ''
                          }`}
                        >
                          {isFunding || contractLoading ? (
                            <>
                              <LoadingSpinner size="small" color="white" className="inline mr-2" />
                              Contributing...
                            </>
                          ) : 'Contribute'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              
              {!isConnected && (
                <div className="mt-8 border-t border-color pt-6 text-center">
                  <p className="text-secondary mb-4">Connect your wallet to contribute to this project</p>
                </div>
              )}
              
              {!canContribute && isConnected && (
                <div className="mt-8 border-t border-color pt-6">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded">
                    {isFullyFunded 
                      ? 'This project has been fully funded. Thank you for your interest!'
                      : isExpired 
                        ? 'This funding period has ended. No more contributions can be accepted.'
                        : 'This project is not accepting contributions at this time.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 