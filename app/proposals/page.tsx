'use client';

import { useEffect, useState } from 'react';
import WalletConnect from '@/components/WalletConnect';
import Link from 'next/link';
import { useAccount } from 'wagmi';

// This would come from an API in a real app
const DUMMY_PROPOSALS = [
  {
    id: '1',
    title: 'AI-Powered Health Monitoring App',
    startupName: 'HealthTech AI',
    description: 'Our platform uses AI to analyze health data and provide personalized insights.',
    amountNeeded: 10,
    totalFunded: 6.5,
    createdAt: new Date('2025-03-15'),
    expiresAt: new Date('2025-04-15'),
    status: 'ACTIVE'
  },
  {
    id: '2',
    title: 'Sustainable Agriculture Marketplace',
    startupName: 'GreenGrow',
    description: 'Connecting farmers directly with consumers to reduce the carbon footprint of food distribution.',
    amountNeeded: 15,
    totalFunded: 3.2,
    createdAt: new Date('2025-03-10'),
    expiresAt: new Date('2025-05-10'),
    status: 'ACTIVE'
  },
  {
    id: '3',
    title: 'Decentralized Energy Trading Platform',
    startupName: 'PowerDAO',
    description: 'Enabling peer-to-peer energy trading using blockchain technology.',
    amountNeeded: 20,
    totalFunded: 20,
    createdAt: new Date('2025-02-20'),
    expiresAt: new Date('2025-04-20'),
    status: 'FUNDED'
  }
];

export default function ProposalsPage() {
  const { isConnected } = useAccount();
  const [proposals, setProposals] = useState(DUMMY_PROPOSALS);

  return (
    <main className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-600">Startup DAO</Link>
              </div>
              <div className="ml-6 flex space-x-4 items-center">
                <Link href="/proposals" className="text-gray-900 font-medium">Proposals</Link>
                {isConnected && (
                  <Link href="/proposals/create" className="text-gray-900 font-medium">Create Proposal</Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <WalletConnect />
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Startup Proposals</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="flex justify-between mb-6">
              <div>
                <span className="text-gray-700">Showing {proposals.length} proposals</span>
              </div>
              {isConnected && (
                <Link 
                  href="/proposals/create" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                >
                  + New Proposal
                </Link>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{proposal.title}</h3>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        proposal.status === 'FUNDED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{proposal.startupName}</p>
                    <p className="text-gray-700 mb-4 h-20 overflow-hidden">{proposal.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress: {Math.round((proposal.totalFunded / proposal.amountNeeded) * 100)}%</span>
                        <span>{proposal.totalFunded} ETH / {proposal.amountNeeded} ETH</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (proposal.totalFunded / proposal.amountNeeded) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <span>Created: {proposal.createdAt.toLocaleDateString()}</span>
                      <span>Expires: {proposal.expiresAt.toLocaleDateString()}</span>
                    </div>
                    
                    <Link 
                      href={`/proposals/${proposal.id}`}
                      className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </main>
  );
} 