"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { authService } from "@/api/services/auth"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword
  }
  return true
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm3({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setError("")
    setIsLoading(true)

    try {
      if (step === 'email') {
        // Step 1: Send OTP to email
        await authService.forgotPassword(values.email)
        setStep('otp')
      } else if (step === 'otp') {
        // Step 2: Verify OTP and get reset token
        const result = await authService.verifyOTP(values.email, values.otp!)
        if (result.verified && result.resetToken) {
          // Step 3: Reset password with token
          if (values.password && values.confirmPassword) {
            await authService.resetPassword(result.resetToken, values.password, values.confirmPassword)
            setStep('success')
          }
        } else {
          setError("Invalid OTP. Please try again.")
        }
      }
    } catch (err: any) {
      const errorMessage = err?.message || "An error occurred. Please try again."
      setError(errorMessage)
      console.error("Forgot password error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError("")
    setIsLoading(true)
    try {
      await authService.forgotPassword(form.getValues('email'))
    } catch (err: any) {
      setError(err?.message || "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex justify-center mb-2">
                  <a href="/" className="flex items-center gap-2 font-medium">
                    <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                      <Logo size={24} />
                    </div>
                    <span className="text-xl">Codexa</span>
                  </a>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 text-green-600 text-5xl">✓</div>
                  <h1 className="text-2xl font-bold">Password Reset Successful</h1>
                  <p className="text-muted-foreground text-balance">
                    Your password has been reset successfully. You can now sign in with your new password.
                  </p>
                </div>
                <Button
                  onClick={() => window.location.href = '/auth/sign-in'}
                  className="w-full cursor-pointer"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
            <div className="bg-muted relative hidden md:block">
              <img
                src="https://ui.codexa.com/placeholder.svg"
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.95] dark:invert"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-6">
                  <div className="flex justify-center mb-2">
                    <a href="/" className="flex items-center gap-2 font-medium">
                      <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                        <Logo size={24} />
                      </div>
                      <span className="text-xl">Codexa</span>
                    </a>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">
                      {step === 'email' ? 'Forgot your password?' : 'Reset Password'}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {step === 'email'
                        ? 'Enter your email to receive a verification code'
                        : 'Enter the OTP sent to your email and your new password'}
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                      {error}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="m@example.com"
                            disabled={step !== 'email'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {step === 'otp' && (
                    <>
                      <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="123456"
                                  maxLength={6}
                                  {...field}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  className="rounded-md underline underline-offset-4 cursor-pointer hover:text-primary whitespace-nowrap"
                                  onClick={handleResendOTP}
                                  disabled={isLoading}
                                >
                                  Resend
                                </Button>
                              </div>
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
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                    {isLoading
                      ? 'Processing...'
                      : step === 'email'
                      ? 'Send OTP'
                      : 'Reset Password'}
                  </Button>

                  <div className="text-center text-sm">
                    Remember your password?{" "}
                    <a href="/auth/sign-in" className="underline underline-offset-4">
                      Back to sign in
                    </a>
                  </div>
                </div>
              </form>
            </Form>
          </div>
          <div className="bg-muted relative hidden md:block">
            <img
              src="https://ui.codexa.com/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.95] dark:invert"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a>{" "}
        and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
      </div>
    </div>
  )
}
