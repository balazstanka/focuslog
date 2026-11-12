"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function RegisterForm() {
  const router = useRouter();
  const [errorMessage, submitRegistration, isPending] = useActionState(register, null);

  async function register(_previousError: string | null, formData: FormData) {
    const { error } = await authClient.signUp.email({
      name: String(formData.get("name")),
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });

    if (error) {
      return error.message ?? "Could not create the account.";
    }

    router.replace("/dashboard");
    return null;
  }

  return (
    <form action={submitRegistration} className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
      <FormField label="Name" name="name" autoComplete="name" />
      <FormField label="Email" name="email" type="email" autoComplete="email" />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
      <Button type="submit" disabled={isPending} className="mt-1">
        Sign up
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground underline decoration-primary underline-offset-3"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
