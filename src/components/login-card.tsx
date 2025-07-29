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

export function LoginCard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, signup, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user) {
      router.push("/interview");
    }
  }, [user, router]);

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
      if (isLoginView) {
        await login(values.email, values.password);
        toast({
          title: "Login Successful",
          description: "Redirecting to your interview...",
        });
        router.push("/interview");
      } else {
        await signup(values.email, values.password);
        toast({
          title: "Signup Successful",
          description: "Redirecting to your interview...",
        });
        router.push("/interview");
      }
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
        <CardTitle>{isLoginView ? 'Welcome Back' : 'Create an Account'}</CardTitle>
        <CardDescription>{isLoginView ? 'Enter your credentials to access your interview.' : 'Sign up to begin your AI-powered interview experience.'}</CardDescription>
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
            <Button variant="link" type="button" onClick={() => setIsLoginView(!isLoginView)}>
              {isLoginView ? 'Don\'t have an account? Sign Up' : 'Already have an account? Login'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}