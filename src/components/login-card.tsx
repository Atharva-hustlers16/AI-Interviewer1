
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "./ui/skeleton";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

interface LoginCardProps {
  isAdminLogin?: boolean;
}

export function LoginCard({ isAdminLogin = false }: LoginCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, signup, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const redirectPath = isAdminLogin ? "/admin/dashboard" : "/interview";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      router.push(redirectPath);
    }
  }, [user, router, redirectPath]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const action = isLoginView ? login : signup;
      await action(values.email, values.password);
      
      toast({
        title: `${isLoginView ? 'Login' : 'Signup'} Successful`,
        description: `Redirecting to ${isAdminLogin ? 'the admin dashboard...' : 'your interview...'}`,
      });
      router.push(redirectPath);

    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (!isClient) {
    return <Skeleton className="h-[440px] w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLoginView ? (isAdminLogin ? 'Admin Login' : 'Welcome Back') : 'Create an Account'}</CardTitle>
        <CardDescription>{isLoginView ? (isAdminLogin ? 'Enter your credentials to access the dashboard.' : 'Enter your credentials to access your interview.') : 'Sign up to begin your AI-powered interview experience.'}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoginView ? 'Login' : 'Sign Up'}
            </Button>
            <Button variant="link" type="button" onClick={() => setIsLoginView(!isLoginView)} disabled={isAdminLogin && !isLoginView}>
              {isLoginView ? 'Don\'t have an account? Sign Up' : 'Already have an account? Login'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
