import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";

const LOREM_IPSUM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const PARAGRAPH_COUNT = 20;

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={null}>
        <WelcomeMessage />
      </Suspense>
      <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-4">
        {Array.from({ length: PARAGRAPH_COUNT }, (_, index) => (
          <p key={index}>{LOREM_IPSUM}</p>
        ))}
      </div>
    </>
  );
}

async function WelcomeMessage() {
  const user = await getCurrentUser();

  return <h1 className="mx-auto w-full max-w-5xl text-2xl font-semibold">Welcome, {user.name}</h1>;
}
