"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { SignInModal } from "@/components/sign-in-modal";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="font-display text-4xl font-bold text-ink mb-4">Welcome Back</h1>
            <p className="text-ink-muted text-lg">Sign in to your Pulse account</p>
          </div>
          <SignInModal
            isOpen={true}
            onClose={() => router.push(redirectTo)}
            initialMode="signin"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-terracotta" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}