import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "./env";

type Session = {
  user: { name: string };
};

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const response = await fetch(`${env.API_URL}/api/auth/get-session`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return session.user;
}
