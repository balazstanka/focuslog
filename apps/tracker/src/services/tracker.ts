import { activeWindow } from "get-windows";
import type { WindowSample } from "@focuslog/shared";
import { uploadSamples } from "./web";

const maxJob = 15;
const MAX_BATCH_SIZE = 50;

const batch: WindowSample[] = [];
let sending = false;

export async function recordActiveWindow() {
  try {
    const window = await activeWindow();

    if (window) {
      batch.push({ title: window.title, name: window.owner.name });
    }
  } catch (err) {
    console.error("could not read active window:", describeError(err));
  }

  if (batch.length >= maxJob && !sending) {
    void flushSamples();
  }
}

async function flushSamples() {
  sending = true;
  const pending = batch.splice(0, MAX_BATCH_SIZE);
  console.log(`sending ${pending.length} samples...`);

  try {
    await uploadSamples(pending);
    console.log(`sent ${pending.length} samples`);
  } catch (err) {
    batch.unshift(...pending);
    console.error(`upload failed, keeping ${batch.length} samples: ${describeError(err)}`);
  } finally {
    sending = false;
  }
}

function describeError(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}
