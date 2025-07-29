import { LoginCard } from '@/components/login-card';
import { BrainCircuit } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
          <BrainCircuit className="h-16 w-16 text-primary" />
          <h1 className="text-4xl font-bold text-primary font-headline md:text-5xl">Elysian Interviewer</h1>
          <p className="max-w-md text-muted-foreground">
            Engage in a seamless, AI-driven interview experience. Our advanced AI will guide you through rounds, adapting to your responses for a truly personalized assessment.
          </p>
        </div>
        <div className="w-full max-w-sm shrink-0">
          <LoginCard />
        </div>
      </div>
    </main>
  );
}
