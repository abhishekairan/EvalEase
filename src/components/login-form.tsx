"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { CircleUser } from "lucide-react"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Zod schema for form validation
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters"),
  role: z.enum(["jury", "admin"], {
    required_error: "Please select a role",
  }),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LoginFormProps extends React.ComponentProps<"div"> {
  className?: string
}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "jury",
    },
  })

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    clearErrors,
  } = form

  const onSubmit = async (data: LoginFormValues) => {
    try {
      clearErrors("root")
      console.log("sigining in with creds: ",data)
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        role: data.role,
        redirect: false,
      })
      console.log("Signin completed with result: ", result)

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("root", {
            type: "manual",
            message: "Invalid email or password",
          })
        } else {
          setError("root", {
            type: "manual",
            message: "Authentication failed. Please try again.",
          })
        }
      } else if (result?.ok) {
        // Success - redirect based on role
        const redirectPath = data.role === "admin" ? "/dashboard" : "/dashboard"
        router.push(redirectPath)
        router.refresh()
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("root", {
        type: "manual",
        message: "An unexpected error occurred. Please try again.",
      })
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2 text-center">
            <CircleUser className="mx-auto h-12 w-12" />
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-balance text-muted-foreground">
              Login to your account
            </p>
          </div>

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
                      disabled={isSubmitting}
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Login as</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                      className="flex flex-row space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="jury" id="jury" />
                        <Label htmlFor="jury">Jury Member</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin">Administrator</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errors.root && (
              <div className="text-sm text-red-500 text-center bg-red-50 p-2 rounded">
                {errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{" "}
            <a href="/register" className="underline">
              Sign up
            </a>
          </div>
        </form>
      </Form>
    </div>
  )
}
