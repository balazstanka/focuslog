import { Suspense } from "react";
import { RedirectIfSignedIn } from "@/components/session-guards";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <Card className="w-full max-w-sm py-10 shadow-2xl shadow-foreground/10">
        <CardContent className="px-10">{children}</CardContent>
      </Card>
    </main>
  );
}
