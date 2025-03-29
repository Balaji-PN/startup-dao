'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';

export default function Home() {
  const router = useRouter();
  
  // Automatically redirect to proposals
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/proposals');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <main className="min-h-screen bg-app">
      <Navigation />
      
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-primary mb-6">Startup DAO</h1>
          <p className="text-xl text-secondary mb-12">Decentralized funding for innovative startups</p>
          <div className="animate-pulse">
            <p className="text-secondary">Redirecting to proposals...</p>
          </div>
        </div>
      </div>
    </main>
  );
}
