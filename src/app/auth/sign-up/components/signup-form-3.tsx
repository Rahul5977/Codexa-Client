"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/logo"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useTheme } from "@/hooks/use-theme"

const signupFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  otp: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type SignupFormValues = z.infer<typeof signupFormSchema>

export function SignupForm3({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [hasOTPSent, setHasOTPSent] = useState(false)
  const [isLoadingOTP, setIsLoadingOTP] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { signup, sendVerificationOTP } = useAuth()
  const {theme} = useTheme()

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  const email = form.watch("email")
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleSendOTP = async () => {
    if (!emailValid) return

    setIsLoadingOTP(true)

    try {
      const success = await sendVerificationOTP(email)
      if (success) {
        setHasOTPSent(true)
        form.setValue('otp', '')
        toast.success("OTP sent successfully", {
          description: `We've sent a 6-digit verification code to ${email}`
        })
      } else {
        toast.error("Failed to send OTP", {
          description: "Please try again."
        })
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "An error occurred while sending OTP."
      toast.error("Failed to send OTP", {
        description: errorMessage
      })
      console.error("Send OTP error:", err)
    } finally {
      setIsLoadingOTP(false)
    }
  }

  const onSubmit = async (values: SignupFormValues) => {
    if (!hasOTPSent || !values.otp) {
      toast.error("Verification required", {
        description: "Please verify your email with OTP first"
      })
      return
    }

    if (values.otp.length !== 6) {
      toast.error("Invalid OTP", {
        description: "Please enter a valid 6-digit OTP"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const fullName = `${values.firstName} ${values.lastName}`
      const success = await signup(fullName, values.email, values.password, values.otp)

      if (success) {
        toast.success("Registration successful", {
          description: "Welcome to Codexa! Redirecting to your dashboard..."
        })
        // Get user from context to determine role-based redirect
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          const user = JSON.parse(savedUser)
          const dashboardPath = user.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'
          navigate(dashboardPath, { replace: true })
        } else {
          navigate('/user/dashboard', { replace: true })
        }
      } else {
        toast.error("Registration failed", {
          description: "Please check your OTP and try again."
        })
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || "An error occurred during registration. Please try again."
      toast.error("Registration failed", {
        description: errorMessage
      })
      console.error("Signup error:", err)
    } finally {
      setIsSubmitting(false)
    }
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
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-muted-foreground text-balance">
                      Enter your information to create a new account
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="email"
                              placeholder="m@example.com"
                              {...field}
                              disabled={hasOTPSent}
                              className={hasOTPSent ? "pr-24" : ""}
                            />
                            {!hasOTPSent && (
                              <Button
                                size="sm"
                                type="button"
                                className="absolute right-0 top-0 h-full rounded-l-none"
                                onClick={handleSendOTP}
                                disabled={!emailValid || isLoadingOTP}
                              >
                                {isLoadingOTP ? "Sending..." : "Send OTP"}
                              </Button>
                            )}
                            {hasOTPSent && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className="text-xs text-success font-medium flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {hasOTPSent && (
                    <div className="bg-primary/5 border border-primary rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          <svg className="w-5 h-5 text-primary mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">
                            OTP Sent Successfully!
                          </h4>
                          <p className="text-xs text-primary mt-1">
                            We've sent a 6-digit verification code to <span className="font-medium">{email}</span>.
                            Please check your inbox and enter the code below.
                          </p>
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel className="text-sm font-medium">Verification Code</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="Enter 6-digit code"
                                  maxLength={6}
                                  className="font-mono text-lg tracking-wider text-center"
                                  {...field}
                                  onChange={(e) => {
                                    // Only allow numbers
                                    const value = e.target.value.replace(/\D/g, '')
                                    field.onChange(value)
                                  }}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  className="whitespace-nowrap"
                                  onClick={handleSendOTP}
                                  disabled={isLoadingOTP}
                                >
                                  {isLoadingOTP ? "Sending..." : "Resend"}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Didn't receive the code? Click Resend to get a new one.
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm">
                            I agree to the{" "}
                            <a href="#" className="underline underline-offset-4 hover:text-primary">
                              Terms of Service
                            </a>{" "}
                            and{" "}
                            <a href="#" className="underline underline-offset-4 hover:text-primary">
                              Privacy Policy
                            </a>
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full cursor-pointer"
                    disabled={!hasOTPSent || isSubmitting}
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Button>

                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <a href="/auth/sign-in" className="underline underline-offset-4">
                      Sign in
                    </a>
                  </div>
                </div>
              </form>
            </Form>
          </div>
          <div className="bg-muted relative hidden md:block">
            <img
              src={theme === 'dark' ? "/signup_dark.jpeg" : "/signup_light.jpeg"}
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.95]"
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
