'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Navigation from '@/components/Navigation';
import { useStartupFundingContract } from '@/lib/web3/useContract';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateProposal() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const { createProposal, isLoading, error: contractError } = useStartupFundingContract();
  
  const [formData, setFormData] = useState({
    title: '',
    startupName: '',
    description: '',
    amountNeeded: '',
    website: '',
    pitchDeck: '',
    duration: '30', // Default 30 days
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setTxError(null);
      
      // Format the proposal description to include startup name and other details
      const fullDescription = `${formData.description}\n\nStartup: ${formData.startupName}\nWebsite: ${formData.website || 'N/A'}\nPitch Deck: ${formData.pitchDeck || 'N/A'}`;
      
      // Call the smart contract to create a proposal
      const txHash = await createProposal(
        formData.title,
        fullDescription,
        formData.amountNeeded,
        parseInt(formData.duration)
      );
      
      if (txHash) {
        // Redirect to proposals page
        router.push('/proposals');
      } else {
        setTxError('Transaction failed. Please try again.');
      }
    } catch (error: any) {
      setTxError(error.message || 'Failed to submit proposal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-app">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-card rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold mb-4 text-primary">Connect Your Wallet</h2>
            <p className="mb-4 text-secondary">You need to connect your wallet to create a proposal.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app">
      <Navigation />
      
      <div className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-primary mb-6">Create Funding Proposal</h1>
          
          <div className="bg-card rounded-lg p-6">
            {(txError || contractError) && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
                {txError || contractError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary">
                    Startup Name
                  </label>
                  <input
                    type="text"
                    name="startupName"
                    value={formData.startupName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary">
                    Proposal Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary">
                    Funding Goal (ETH)
                  </label>
                  <input
                    type="number"
                    name="amountNeeded"
                    value={formData.amountNeeded}
                    onChange={handleChange}
                    required
                    min="0.1"
                    step="0.1"
                    className="mt-1 block w-full rounded-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary">
                    Funding Duration (Days)
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary">
                    Website URL (optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary">
                    Pitch Deck URL (optional)
                  </label>
                  <input
                    type="url"
                    name="pitchDeck"
                    value={formData.pitchDeck}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-color bg-background text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/proposals')}
                    className="btn-secondary px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="btn-primary px-4 py-2 rounded-md flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="small" className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Create Proposal'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
} 