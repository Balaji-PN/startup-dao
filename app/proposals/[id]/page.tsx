'use client';

import { useState, useEffect } from 'react';
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
  
  const { 
    contributeToProposal, 
    getProposal, 
    isLoading: contractLoading, 
    error: contractError 
  } = useStartupFundingContract();

  // Load proposal data
  useEffect(() => {
    console.log("[DEBUG] ProposalDetail useEffect for loading proposal triggered");
    
    async function loadProposal() {
      if (!id) {
        console.log("[DEBUG] No ID found, skipping loadProposal");
        return;
      }
      
      console.log("[DEBUG] Starting to load proposal with ID:", id);
      
      try {
        setIsLoading(true);
        console.log("[DEBUG] Calling getProposal with ID:", id.toString());
        const proposalData = await getProposal(BigInt(id.toString()));
        
        if (proposalData) {
          console.log("[DEBUG] Proposal data loaded successfully:", proposalData);
          setProposal(proposalData);
        } else {
          console.log("[DEBUG] No proposal data returned, using fallback data");
          // If we can't get the data from the blockchain yet, use dummy data for demo
          setProposal({
            creator: '0x1234567890abcdef1234567890abcdef12345678',
            title: 'AI-Powered Health Monitoring App',
            description: 'Our platform uses AI to analyze health data and provide personalized insights.\n\nStartup: HealthTech AI\nWebsite: https://healthtechai.example.com\nPitch Deck: https://healthtechai.example.com/pitch',
            fundingGoal: 10,
            amountRaised: 6.5,
            deadline: new Date('2025-04-15'),
            claimed: false,
            active: true
          });
        }
      } catch (error) {
        console.error('[DEBUG] Error loading proposal:', error);
      } finally {
        console.log("[DEBUG] Finished loading proposal, setting isLoading to false");
        setIsLoading(false);
      }
    }
    
    loadProposal();
    
    return () => {
      console.log("[DEBUG] ProposalDetail proposal loading effect cleanup");
    };
  }, [id, getProposal]);

  // Handle contribution form submission
  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (!id || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      setFundingError('Please enter a valid contribution amount');
      return;
    }
    
    try {
      setIsFunding(true);
      setFundingError(null);
      
      const txHash = await contributeToProposal(
        BigInt(id.toString()),
        contributionAmount
      );
      
      if (txHash) {
        console.log('Transaction hash:', txHash);
        setContributionAmount('');
        
        // Update the proposal data (in a real app, this would be more robust)
        if (proposal) {
          setProposal({
            ...proposal,
            amountRaised: proposal.amountRaised + parseFloat(contributionAmount)
          });
        }
      } else {
        setFundingError('Transaction failed. Please check the console for details.');
      }
    } catch (error: any) {
      console.error('Error contributing to proposal:', error);
      setFundingError(error.message || 'Failed to contribute. Please try again.');
    } finally {
      setIsFunding(false);
    }
  };

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