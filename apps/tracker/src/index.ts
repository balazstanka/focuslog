import { activeWindow } from "get-windows";
import type { WindowSample } from "@focuslog/shared";

const API_URL = process.env.API_URL ?? "http://localhost:3001/samples";
const maxJob = 15;

const batch: WindowSample[] = [];
let sending = false;

const sendJobs = async () => {
  sending = true;
  const toSend = batch.splice(0);
  console.log("sending " + toSend.length + " jobs to the server...");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSend),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    // put the samples back so the next attempt retries them
    batch.unshift(...toSend);
    console.error("upload failed, keeping " + batch.length + " jobs:", (err as Error).message);
  } finally {
    sending = false;
  }
};

const jobs = async () => {
  try {
    const window = await activeWindow();
    if (window) {
      batch.push({ title: window.title, name: window.owner.name });
    }
  } catch (err) {
    console.error("could not read active window:", (err as Error).message);
  }

  if (batch.length >= maxJob && !sending) {
    await sendJobs();
  }
};

setInterval(() => jobs(), 1000);
