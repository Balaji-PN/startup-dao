'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import Navigation from '@/components/Navigation';
import { useStartupFundingContract } from '@/lib/web3/useContract';
import LoadingSpinner from '@/components/LoadingSpinner';

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

  const { 
    getProposal, 
    proposalCount, 
    refetchProposalCount
  } = useStartupFundingContract();

  // Load proposals only when proposalCount changes
  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      // If we have proposals from the contract
      if (proposalCount && proposalCount > 0) {
        const fetchedProposals: Proposal[] = [];
        
        // Fetch each proposal by ID
        for (let i = 1; i <= proposalCount; i++) {
          try {
            const proposal = await getProposal(BigInt(i));
            if (proposal) {
              fetchedProposals.push({
                id: i,
                ...proposal
              });
            }
          } catch (error) {
            // Silent error for individual proposals
          }
        }
        
        setProposals(fetchedProposals);
      } else {
        // For demo purposes, add some sample proposals if none are found
        setProposals(SAMPLE_PROPOSALS);
      }
    } catch (error: any) {
      setLoadError(error.message || 'Failed to load proposals');
    } finally {
      setIsLoading(false);
    }
  }, [proposalCount, getProposal]);

  // Call loadProposals when proposalCount changes
  useEffect(() => {
    loadProposals();
  }, [loadProposals]);
  
  // Refresh data when page mounts
  useEffect(() => {
    refetchProposalCount?.();
  }, [refetchProposalCount]);

  return (
    <main className="min-h-screen bg-app">
      <Navigation />
      
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">Startup Proposals</h1>
            
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
          
          {isLoading ? (
            <div className="bg-card rounded-lg p-6 text-center">
              <LoadingSpinner size="large" className="mb-4" />
              <p className="text-primary">Loading proposals...</p>
            </div>
          ) : loadError ? (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4 my-4">
              <p>{loadError}</p>
              <button 
                onClick={() => refetchProposalCount?.()}
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