// © 2025 Quartermasters FZC. All rights reserved.

import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Taxi Dispatch</CardTitle>
          <CardDescription>
            {step === 'identifier' 
              ? 'Enter your phone number or email to sign in'
              : 'Enter the verification code sent to your device'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
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
