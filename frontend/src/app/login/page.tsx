"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ControllerRenderProps, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { AxiosError } from "axios";

import { useAuthStore } from "@/store/auth";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Define login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface ErrorResponse {
  message: string;
}

// This is the main component that gets exported
export default function LoginPage() {
  // Use a safe mounting pattern to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render the actual login component when the component has mounted on the client
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-sm animate-pulse">
          <CardHeader className="space-y-1">
            <div className="h-6 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="h-10 bg-muted rounded mb-4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Once mounted, render the full component
  return <LoginForm />;
}

// This is the inner component
function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Use separate selectors for each state piece to avoid object comparison issues
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Initialize form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/en/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  // Function to fetch user profile
  const fetchAndSetUser = async () => {
    try {
      const response = await axiosInstance.get("/auth/profile");
      const userData = response.data;
      console.log("User profile data:", userData);

      // Ensure user data has the expected structure
      const user = {
        ...userData,
        // Ensure clinic data is properly structured
        clinic: userData.clinic || null,
      };

      setUser(user);
      return true;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("An error occurred while retrieving your profile.");
      return false;
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await axiosInstance.post("/auth/login", data);
      const { access_token } = response.data;

      // Update auth store with access token
      setAccessToken(access_token);

      // Fetch and set user data
      const profileSuccess = await fetchAndSetUser();

      if (profileSuccess) {
        toast.success("Login successful! Redirecting to dashboard...");
        router.push("/en/dashboard");
      } else {
        // If profile fetch fails, clear the token
        setAccessToken(null);
        toast.error("An error occurred while signing in.");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);

      // Extract error message
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message ||
        "An error occurred while signing in.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only render the login form if user is not authenticated
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<LoginFormValues, "email">;
                }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        {...field}
                        className="w-full"
                        type="email"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<LoginFormValues, "password">;
                }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
