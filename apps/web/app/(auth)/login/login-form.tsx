"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, submitLogin, isPending] = useActionState(logIn, null);

  async function logIn(_previousError: string | null, formData: FormData) {
    const { error } = await authClient.signIn.email({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (error) {
      return error.message ?? "Could not log in.";
    }

    router.replace("/dashboard");
    return null;
  }

  return (
    <form action={submitLogin} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <FormField label="Email" name="email" type="email" autoComplete="email" />
      <FormField label="Password" name="password" type="password" autoComplete="current-password" />
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button type="submit" disabled={isPending} className="mt-1">
        Log in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <Link
          href="/register"
          className="text-foreground underline decoration-primary underline-offset-3"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
