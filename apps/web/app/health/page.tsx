import { Suspense } from "react";
import { env } from "@/lib/env";

type HealthStatus = { ok: boolean; protocol: number };

export default function HealthPage() {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-semibold">Health Check</h1>
      <Suspense fallback={<p>Checking backend...</p>}>
        <BackendHealth />
      </Suspense>
    </div>
  );
}

async function BackendHealth() {
  const response = await fetchBackendHealth();

  if (!response) {
    return <p className="text-2xl text-amber-700">Something went wrong...</p>;
  }

  return <p>Protocol version: {response.protocol}</p>;
}

async function fetchBackendHealth(): Promise<HealthStatus | null> {
  try {
    const response = await fetch(`${env.API_URL}/health`);
    const res = await response.json();

    if (res.ok) {
      return res;
    }

    return null;
  } catch (err) {
    console.log(err);
  }

  return null;
}
