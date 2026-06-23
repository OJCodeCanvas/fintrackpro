"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, PieChart, Target, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrentUser } from "@/lib/store";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";

const features = [
  { icon: Wallet, title: "Track Everything", desc: "Income & expenses in one place" },
  { icon: PieChart, title: "Smart Analytics", desc: "Visualize your spending" },
  { icon: Target, title: "Budget Goals", desc: "Stay on track with alerts" },
  { icon: TrendingUp, title: "Trends", desc: "See your financial growth" },
];

export function AuthScreen({ onSuccess }: { onSuccess: (user: CurrentUser) => void }) {
  const [loading, setLoading] = useState<"login" | "register" | "demo" | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("login");
    const formData = new FormData(e.currentTarget);
    try {
      const data = await apiFetch<{ user: CurrentUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      onSuccess(data.user);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(null);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading("register");
    const formData = new FormData(e.currentTarget);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      toast.error("Passwords do not match");
      setLoading(null);
      return;
    }
    try {
      const data = await apiFetch<{ user: CurrentUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          name: formData.get("name"),
        }),
      });
      onSuccess(data.user);
      toast.success("Account created! Sample data loaded.");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(null);
    }
  };

  const handleDemo = async () => {
    setLoading("demo");
    try {
      const data = await apiFetch<{ user: CurrentUser }>("/api/auth/demo", { method: "POST" });
      onSuccess(data.user);
      toast.success("Logged in as demo user");
    } catch (err: any) {
      toast.error(err.message || "Demo login failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side — branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-700 dark:via-emerald-800 dark:to-teal-900 p-8 lg:p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold">FinTrack</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 space-y-6"
        >
          <div>
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-3">
              Take control of your finances
            </h1>
            <p className="text-emerald-50 text-base lg:text-lg max-w-md">
              A beautiful, modern way to track your income, expenses, budgets, and spending insights.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10"
              >
                <f.icon className="w-5 h-5 mb-2" />
                <div className="font-semibold text-sm">{f.title}</div>
                <div className="text-xs text-emerald-50/80">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-emerald-50/60">
          © {new Date().getFullYear()} FinTrack. Built for smarter spending.
        </div>
      </div>

      {/* Right side — auth form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/60 shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in or create an account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input id="login-email" name="email" type="email" placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input id="login-password" name="password" type="password" placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading !== null}>
                      {loading === "login" ? "Signing in..." : "Sign In"}
                      {loading !== "login" && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Name</Label>
                      <Input id="reg-name" name="name" type="text" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" name="email" type="email" placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" name="password" type="password" placeholder="At least 6 characters" required />
                      <p className="text-[11px] text-muted-foreground">Min 6 characters</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-confirm">Confirm Password</Label>
                      <Input id="reg-confirm" name="confirmPassword" type="password" placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading !== null}>
                      {loading === "register" ? "Creating account..." : "Create Account"}
                      {loading !== "register" && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Your account starts fresh — add your own transactions
                    </p>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                onClick={handleDemo}
                variant="outline"
                className="w-full"
                disabled={loading !== null}
              >
                <Sparkles className="mr-2 w-4 h-4" />
                {loading === "demo" ? "Loading demo..." : "Try Demo Account"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Demo comes pre-loaded with sample data to explore
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
