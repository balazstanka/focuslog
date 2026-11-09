"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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
    <header className="sticky top-10 z-50 mt-10 mb-3 flex justify-center px-4">
      <nav className="flex w-full max-w-5xl items-center justify-between border-b border-foreground/10 bg-background/80 p-4 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-xl">Focuslog</span>
          <ul className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`block border-b-2 py-1 text-xl ${
                    pathname === item.href ? "border-foreground" : "border-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={logOut} className="cursor-pointer py-1 text-sm">
          Logout
        </button>
      </nav>
    </header>
  );
}
