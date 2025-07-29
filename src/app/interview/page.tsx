import { InterviewClient } from '@/components/interview-client';
import { Suspense } from 'react';

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading Interview...</div>}>
      <InterviewClient />
    </Suspense>
  );
}
