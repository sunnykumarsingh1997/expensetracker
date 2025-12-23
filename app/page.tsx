'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Loader2, Target } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Redirect based on auth status
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-hitman-gradient flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <Target className="w-24 h-24 text-hitman-red animate-pulse" />
        </div>
        <h1 className="font-hitman text-2xl text-white mb-4">AGENT EXPENSE TRACKER</h1>
        <Loader2 className="w-8 h-8 text-hitman-red animate-spin mx-auto" />
        <p className="text-gray-500 mt-4">Initializing secure connection...</p>
      </div>
    </div>
  );
}
