'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-gray-900">Decentralized Startup Fundraising</h1>
            <p className="mt-2 text-lg text-gray-600">Fund innovative startups using blockchain technology</p>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900">For Startups</h3>
                    <p className="mt-2 text-gray-600">Create a funding proposal with your pitch deck and funding goal</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900">For Investors</h3>
                    <p className="mt-2 text-gray-600">Browse proposals and fund promising startups with ETH</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900">Smart Contracts</h3>
                    <p className="mt-2 text-gray-600">Secure fundraising with transparent, decentralized contracts</p>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <Link 
                    href="/proposals" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-medium transition"
                  >
                    Explore Startups
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
}
