"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [{ href: "/dashboard", label: "Dashboard" }];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-2 z-50 flex justify-center px-4">
      <nav className="flex w-full max-w-5xl items-center justify-between border-b rounded-lg border-border bg-background/80 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-xl">Focuslog</span>
          <ul className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "block border-b-2 py-1 text-xl transition-colors",
                    pathname === item.href
                      ? "border-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button type="button" variant="ghost" size="sm" onClick={logOut}>
            Logout
          </Button>
        </div>
      </nav>
    </header>
  );
}
