import type { WindowSample } from "@focuslog/shared";
import { env } from "../env";

export async function uploadSamples(samples: WindowSample[]) {
  const res = await fetch(`${env.API_URL}/samples`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(samples),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}
