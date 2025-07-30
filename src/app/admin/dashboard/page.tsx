
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LogOut, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface InterviewReport {
  id: string;
  userEmail: string;
  createdAt: Timestamp;
  report: {
    overallAssessment: string;
    strengths: string[];
    areasForImprovement: string[];
  };
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<InterviewReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/admin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchReports = async () => {
      if (user) {
        try {
          setIsLoadingReports(true);
          const q = query(collection(db, "interviews"), orderBy("createdAt", "desc"));
          const querySnapshot = await getDocs(q);
          const fetchedReports: InterviewReport[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure createdAt is a Firestore Timestamp
            const reportData = { 
              id: doc.id, 
              ...data,
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds)
            } as InterviewReport;
            fetchedReports.push(reportData);
          });
          setReports(fetchedReports);
        } catch (error) {
          console.error("Error fetching reports:", error);
        } finally {
          setIsLoadingReports(false);
        }
      }
    };

    fetchReports();
  }, [user]);

  if (authLoading || !user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
          </div>
          <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
          </Button>
      </header>
      <main className="flex-1 p-4 sm:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Candidate Interview Reports</CardTitle>
            <CardDescription>Review the performance of all candidates who have completed the interview.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReports ? (
              <div className="flex justify-center items-center gap-2 py-8">
                <Loader2 className="animate-spin" />
                <p>Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No interview reports found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate Email</TableHead>
                    <TableHead>Interview Date</TableHead>
                    <TableHead>Overall Assessment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.userEmail}</TableCell>
                      <TableCell>{report.createdAt && new Date(report.createdAt.seconds * 1000).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.report.overallAssessment}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">View Report</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Interview Report for {report.userEmail}</DialogTitle>
                              <DialogDescription>
                                Completed on {report.createdAt && new Date(report.createdAt.seconds * 1000).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <Alert>
                                  <AlertTitle>Overall Assessment</AlertTitle>
                                  <AlertDescription>{report.report.overallAssessment}</AlertDescription>
                                </Alert>

                                <div>
                                    <h3 className="font-semibold mb-2">Strengths</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {report.report.strengths.map((strength, i) => <Badge key={i} variant="secondary">{strength}</Badge>)}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Areas for Improvement</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {report.report.areasForImprovement.map((area, i) => <Badge key={i} variant="destructive">{area}</Badge>)}
                                    </div>
                                </div>
                              </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
