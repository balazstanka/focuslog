import { activeWindow } from "get-windows";

export async function recordActiveWindow() {
  try {
    const window = await activeWindow();

    if (window) {
      console.log(`${window.owner.name}: ${window.title}`);
    }
  } catch (err) {
    console.error("could not read active window:", describeError(err));
  }
}

function describeError(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}
