
import { LoginCard } from '@/components/login-card';
import { UserCog } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8 md:flex-row md:justify-center">
        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
          <UserCog className="h-16 w-16 text-primary" />
          <h1 className="text-4xl font-bold text-primary font-headline md:text-5xl">Admin Panel</h1>
          <p className="max-w-md text-muted-foreground">
            Log in to monitor ongoing interviews and view candidate performance reports.
          </p>
        </div>
        <div className="w-full max-w-sm shrink-0">
          <LoginCard isAdminLogin />
        </div>
      </div>
    </main>
  );
}
