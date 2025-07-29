'use client';

import { InterviewClient } from '@/components/interview-client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';

export default function InterviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }
  
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading Interview...</div>}>
      <InterviewClient />
    </Suspense>
  );
}