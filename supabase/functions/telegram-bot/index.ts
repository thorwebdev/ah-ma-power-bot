// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

console.log(`Function "telegram-bot" up and running!`);

import {
  Bot,
  webhookCallback,
  InlineKeyboard,
} from "https://deno.land/x/grammy@v1.16.2/mod.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

// Construct a keyboard.
const inlineKeyboard = new InlineKeyboard()
  .text("English", "0-en")
  .row()
  .text("中文", "0-cn")
  .row()
  .text("Melayu", "0-ms")
  .row()
  .text("தமிழ்", "0-ta")
  .row();

// Send a keyboard along with a message.
bot.command("start", async (ctx) => {
  await ctx.reply("Choose your preferred language.", {
    reply_markup: inlineKeyboard,
  });
});

// Handle button callback
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat?.id;
  if (data !== "0-en") {
    await ctx.answerCallbackQuery({
      text: "Sorry, this language is not yet supported. Please choose English to continue!",
    });
    if (chatId)
      ctx.api.sendMessage(
        chatId,
        "Sorry, this language is not yet supported. Please choose English to continue!"
      );
  } else {
    if (chatId)
      ctx.api.sendMessage(
        chatId,
        "Great, let's get started 🚀 What's your name?"
      );
  }
});

// Handle incoming messages
bot.on("message", async (ctx) => {
  const message = ctx.message; // the message object
  const userId = ctx.from.id;
  // Get user record from database

  // Handle steps
  console.log(message);
});

const handleUpdate = webhookCallback(bot, "std/http");

serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.searchParams.get("secret") !== Deno.env.get("FUNCTION_SECRET")) {
      return new Response("not allowed", { status: 405 });
    }

    return await handleUpdate(req);
  } catch (err) {
    console.error(err);
  }
});
