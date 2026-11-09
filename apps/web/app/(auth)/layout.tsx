import { Suspense } from "react";
import { RedirectIfSignedIn } from "@/components/session-guards";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 p-8 shadow-lg">
        {children}
      </div>
    </main>
  );
}
