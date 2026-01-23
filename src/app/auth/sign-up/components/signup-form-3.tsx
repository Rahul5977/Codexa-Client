"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Logo } from "@/components/logo"
import { useState } from "react"

export function SignupForm3({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [hasOTPSent, setHasOTPSent] = useState(false)
  const [email, setEmail] = useState("")

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleOTP = () => {
    // Logic to send OTP goes here
    setHasOTPSent(true)
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
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
                <div className="grid gap-3">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  {/*  Button should be disabled when email is empty */}
                  <Button
                    size="sm"
                    className="absolute right-0 top-0 rounded-md cursor-pointer"
                    onClick={handleOTP}
                    disabled={hasOTPSent || !emailValid}
                  >
                    Send OTP
                  </Button>
                </div>
              </div>
              {hasOTPSent && (
                <div className="grid gap-3">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="flex items-center justify-between">
                    <Input id="otp" type="text" placeholder="123456" required />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 rounded-md underline underline-offset-4 cursor-pointer hover:text-primary"
                      onClick={handleOTP}
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" required />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" required />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <a href="#" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </a>
                </Label>
              </div>
              <Button type="submit" className="w-full cursor-pointer" disabled={!hasOTPSent}>
                Create Account
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <a href="/auth/sign-in" className="underline underline-offset-4">
                  Sign in
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="https://ui.codexa.com/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.95] dark:invert"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
