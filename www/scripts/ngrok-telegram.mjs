#!/usr/bin/env node
/**
 * Start ngrok tunnel and set Telegram webhook to point to local dev server.
 * Usage: node scripts/ngrok-telegram.mjs
 * 
 * Requires: pnpm install ngrok (already installed)
 * Make sure your Next.js dev server is running on http://localhost:3000
 */

import ngrok from "ngrok";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually (no dotenv dependency needed)
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const LOCAL_PORT = 3000;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN not found in .env.local");
  process.exit(1);
}

async function main() {
  console.log("🚀 Starting ngrok tunnel to localhost:" + LOCAL_PORT + "...\n");

  try {
    const url = await ngrok.connect(LOCAL_PORT);
    const webhookUrl = `${url}/api/telegram`;

    console.log("✅ ngrok tunnel active:");
    console.log(`   Public URL:  ${url}`);
    console.log(`   Webhook URL: ${webhookUrl}`);
    console.log(`   Local:       http://localhost:${LOCAL_PORT}\n`);

    // Set Telegram webhook
    console.log("📡 Setting Telegram webhook...");
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      }
    );
    const data = await res.json();

    if (data.ok) {
      console.log("✅ Webhook set successfully!");
      console.log(`   ${data.description}\n`);
    } else {
      console.error("❌ Failed to set webhook:", data);
    }

    // Get bot info
    const infoRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
    );
    const infoData = await infoRes.json();
    if (infoData.ok) {
      console.log(`🤖 Bot: @${infoData.result.username} (${infoData.result.first_name})`);
      console.log(`   Send a message to https://t.me/${infoData.result.username}\n`);
    }

    console.log("📋 Logs will appear in your Next.js dev server terminal.");
    console.log("   Press Ctrl+C to stop the tunnel.\n");

    // Keep alive
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down ngrok tunnel...");
      // Remove webhook
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`
      );
      console.log("✅ Webhook removed.");
      await ngrok.disconnect();
      await ngrok.kill();
      process.exit(0);
    });
  } catch (err) {
    console.error("❌ Failed to start ngrok:", err.message);
    console.error("\nMake sure to run: pnpm approve-builds");
    process.exit(1);
  }
}

main();
