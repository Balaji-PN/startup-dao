import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { getStartupFundingContract, convertToWei, formatProposalData } from './contracts';
import { useState, useCallback } from 'react';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from './config';

export function useStartupFundingContract() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get contract config once
  const contract = getStartupFundingContract();
  const { writeContractAsync } = useWriteContract();
  
  // Get proposal count
  const { data: proposalCount, refetch: refetchProposalCount } = useReadContract({
    ...contract,
    functionName: 'proposalCount',
  });

  // Create a new proposal
  const createProposal = useCallback(async (
    title: string,
    description: string,
    fundingGoalEth: string,
    durationInDays: number
  ) => {
    if (!isConnected) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const fundingGoalWei = convertToWei(fundingGoalEth);
      const hash = await writeContractAsync({
        ...contract,
        functionName: 'createProposal',
        args: [title, description, fundingGoalWei, BigInt(durationInDays)],
      });
      
      return hash;
    } catch (err: any) {
      setError(err.message || 'Failed to create proposal');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contract, writeContractAsync, isConnected]);

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

  // Get proposal details
  const getProposal = useCallback(async (proposalId: bigint) => {
    try {
      setIsLoading(true);
      
      const data = await readContract(wagmiConfig, {
        ...contract,
        functionName: 'getProposal',
        args: [proposalId],
      });
      
      if (!data) {
        return null;
      }
      
      const formattedData = formatProposalData(data);
      return formattedData;
    } catch (err: any) {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  // Return stable values
  return {
    isLoading,
    error,
    proposalCount: proposalCount ? Number(proposalCount) : 0,
    refetchProposalCount,
    createProposal,
    contributeToProposal,
    getProposal,
  };
} 