// © 2025 Quartermasters FZC. All rights reserved.

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useRequestOtp, useVerifyOtp } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const identifierSchema = z.object({
  identifier: z.string().min(1, "Phone number or email is required"),
});

const otpSchema = z.object({
  code: z.string().length(6, "OTP code must be 6 digits"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const { toast } = useToast();

  // Handle Google OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Store the token and redirect to dashboard
      localStorage.setItem('auth_token', token);
      toast({
        title: "Login Successful",
        description: "Welcome to Taxi Dispatch Admin Console.",
      });
      
      // Clear the token from URL and redirect
      window.history.replaceState({}, document.title, window.location.pathname);
      setLocation('/');
    }
  }, [setLocation, toast]);

  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();

  const identifierForm = useForm<z.infer<typeof identifierSchema>>({
    resolver: zodResolver(identifierSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmitIdentifier = async (values: z.infer<typeof identifierSchema>) => {
    try {
      await requestOtpMutation.mutateAsync(values.identifier);
      setIdentifier(values.identifier);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Please check your phone or email for the verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmitOtp = async (values: z.infer<typeof otpSchema>) => {
    try {
      await verifyOtpMutation.mutateAsync({
        identifier,
        code: values.code,
      });
      
      toast({
        title: "Login Successful",
        description: "Welcome to Taxi Dispatch Admin Console.",
      });
      
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Taxi Dispatch</CardTitle>
          <CardDescription>
            {step === 'identifier' 
              ? 'Sign in to access the admin console'
              : 'Enter the verification code sent to your device'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'identifier' ? (
            <>
              <Button 
                onClick={handleGoogleLogin}
                variant="outline" 
                className="w-full mb-4"
                data-testid="button-google-login"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="relative mb-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>
            </>
          ) : null}
          
          {step === 'identifier' ? (
            <Form {...identifierForm}>
              <form onSubmit={identifierForm.handleSubmit(onSubmitIdentifier)} className="space-y-4">
                <FormField
                  control={identifierForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone or Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1234567890 or email@example.com" 
                          {...field}
                          data-testid="input-identifier"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={requestOtpMutation.isPending}
                  data-testid="button-request-otp"
                >
                  {requestOtpMutation.isPending ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onSubmitOtp)} className="space-y-4">
                <FormField
                  control={otpForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000000" 
                          maxLength={6}
                          {...field}
                          data-testid="input-otp-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifyOtpMutation.isPending}
                  data-testid="button-verify-otp"
                >
                  {verifyOtpMutation.isPending ? 'Verifying...' : 'Sign In'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setStep('identifier')}
                  data-testid="button-back"
                >
                  Back
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
