"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/logo"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

export function LoginForm3({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, isLoading } = useAuth()
  const [error, setError] = useState<string>("")
  const navigate = useNavigate()
  const location = useLocation()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setError("")
      const success = await login(values.email, values.password)

      if (success) {
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
        setError("Invalid email or password. Please try again.")
      }
    } catch (err: any) {
      const errorMessage = err?.message || "An error occurred during login. Please try again."
      setError(errorMessage)
      console.error("Login error:", err)
    }
  }
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex justify-center mb-2">
                <Link to="/" className="flex items-center gap-2 font-medium">
                  <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
                    <Logo size={24} />
                  </div>
                  <span className="text-xl">Codexa</span>
                </Link>
              </div>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Codexa account
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-6">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                        {error}
                      </div>
                    )}
                    <div className="grid gap-4">
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
                                {...field}
                              />
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
                            <div className="flex items-center">
                              <FormLabel>Password</FormLabel>
                              <Link
                                to="/auth/forgot-password"
                                className="ml-auto text-sm underline-offset-4 hover:underline"
                              >
                                Forgot your password?
                              </Link>
                            </div>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Login"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link to="/auth/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
          <div className="bg-muted relative hidden md:block">
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Join Codexa Today</h3>
                <p className="text-sm text-muted-foreground">
                  Access thousands of coding problems and improve your skills
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our <Link to="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</Link>{" "}
        and <Link to="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</Link>.
      </div>
    </div>
  )
}
