// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.25.0";
import { Database } from "../_shared/db_types.ts";

console.log(`Function "telegram-bot" up and running!`);

import {
  Bot,
  webhookCallback,
  InlineKeyboard,
} from "https://deno.land/x/grammy@v1.16.2/mod.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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
    if (chatId) {
      // TODO move to separate command?
      await supabase.from("users").delete().eq("id", chatId);
      await ctx.answerCallbackQuery();
      ctx.api.sendMessage(
        chatId,
        "Great, let's get started 🚀 What's your full name?"
      );
    }
  }
});

// Handle incoming messages
bot.on("message", async (ctx) => {
  const message = ctx.message; // the message object
  const userId = ctx.from.id;
  // Get user record from database
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.log(`Error ${error.message} for user ${userId}`);
    return ctx.api.sendMessage(
      userId,
      "Sorry, there was an error! Please try again using the /start command!"
    );
  }
  if (!data) {
    // New user, let's create them
    const { error } = await supabase
      .from("users")
      .insert({ id: userId, name: message.text! });
    if (error) {
      console.log(`Error ${error.message} for user ${userId}`);
      return ctx.api.sendMessage(
        userId,
        "Sorry, there was an error! Please try again using the /start command!"
      );
    }
    return ctx.api.sendMessage(
      userId,
      `Awesome, welcome ${message.text}! What's your age?`
    );
  }
  // Handle steps
  const { step } = data;
  switch (step) {
    case 0:
      {
        // Collect age
        const { error } = await supabase
          .from("users")
          .update({ age: Number(message.text!), step: step + 1 })
          .eq("id", userId);
        if (error) {
          console.log(`Error ${error.message} for user ${userId}`);
          return ctx.api.sendMessage(
            userId,
            "Sorry, there was an error! Please try again using the /start command!"
          );
        }
        ctx.api.sendMessage(
          userId,
          `Thank you! Now tell us a bit about your work experience!`
        );
      }
      break;
    case 1:
      {
        // Collect experience
        const { error } = await supabase
          .from("users")
          .update({ experience: message.text!, step: step + 1 })
          .eq("id", userId);
        if (error) {
          console.log(`Error ${error.message} for user ${userId}`);
          return ctx.api.sendMessage(
            userId,
            "Sorry, there was an error! Please try again using the /start command!"
          );
        }
        ctx.api.sendMessage(
          userId,
          `Thank you! Lastly, please take a picture of your face using the front camera of your phone, or reply with "No" if you prefer not to.`
        );
      }
      break;
    case 2:
      {
        // Collect photo
        let photo_url = null;
        if (message.text?.toLowerCase() !== "no") {
          // TODO: handle photo uplpad.
          console.log("photo upload", message);
        }
        const { error } = await supabase
          .from("users")
          .update({ photo_url, step: step + 1 })
          .eq("id", userId);
        if (error) {
          console.log(`Error ${error.message} for user ${userId}`);
          return ctx.api.sendMessage(
            userId,
            "Sorry, there was an error! Please try again using the /start command!"
          );
        }
        ctx.api.sendMessage(
          userId,
          `Thank you! Please wait a moment while we generate your resume. You will get a notification once that process is complete.`
        );
      }
      break;
    default:
      console.log(`Unhandled step: ${step}`);
      ctx.api.sendMessage(
        userId,
        "Sorry, there was an error! Please try again using the /start command!"
      );
      break;
  }
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
