'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import WalletConnect from './WalletConnect';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { isConnected } = useAccount();
  const pathname = usePathname();
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">Startup DAO</Link>
            </div>
            <div className="ml-6 flex space-x-4 items-center">
              <Link 
                href="/proposals" 
                className={`font-medium ${pathname === '/proposals' 
                  ? 'text-blue-600' 
                  : 'text-gray-900 hover:text-gray-700'}`}
              >
                Proposals
              </Link>
              {isConnected && (
                <Link 
                  href="/proposals/create" 
                  className={`font-medium ${pathname === '/proposals/create' 
                    ? 'text-blue-600' 
                    : 'text-gray-900 hover:text-gray-700'}`}
                >
                  Create Proposal
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
} 