// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../_shared/db_types.ts";

console.log(`Function "telegram-bot" up and running!`);

import { Bot, webhookCallback, InlineKeyboard } from "grammy";

const telegramBotToken = Deno.env.get("BOT_TOKEN");
const bot = new Bot(telegramBotToken || "");
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
          `Thank you! Now tell us a bit about your work experience! No need to type, you can simply record a voice message!`
        );
      }
      break;
    case 1:
      {
        //  Check if we have audio recording
        const file = await ctx.getFile();
        const fileURL = `https://api.telegram.org/file/bot${telegramBotToken}/${file.file_path}`;
        const filename = file.file_path?.split("/")[1];
        console.log("voice message", fileURL, filename);
        // Convert audio
        const headers = {
          Authorization: `Bearer ${Deno.env.get("CLOUDCONVERT_API_KEY")}`,
          "Content-type": "application/json",
          accept: "application/json",
        };
        console.log("cloudconvert headers", headers);
        const audioConversionRes = await fetch(
          `https://api.cloudconvert.com/v2/jobs`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              tasks: {
                "import-1": {
                  operation: "import/url",
                  url: fileURL,
                  filename,
                },
                "task-1": {
                  filename: `${userId}.mp3`,
                  operation: "convert",
                  input_format: "oga",
                  output_format: "mp3",
                  engine: "ffmpeg",
                  input: ["import-1"],
                  audio_codec: "mp3",
                  audio_qscale: 0,
                },
                "export-1": {
                  operation: "export/url",
                  input: ["task-1"],
                  inline: false,
                  archive_multiple_files: false,
                },
              },
              tag: "jobbuilder",
            }),
          }
        ).then((res) => res.json());
        console.log("audioConversionRes", audioConversionRes);
        // Store experience
        const { error } = await supabase
          .from("users")
          .update({
            experience: message.text ?? null,
            step: step + 1,
          })
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
        let photo_path = null;
        if (!message.text || message.text?.toLowerCase() !== "no") {
          // handle photo uplpad.
          const file = await ctx.getFile();
          const fileURL = `https://api.telegram.org/file/bot${telegramBotToken}/${file.file_path}`;
          // Upload to supabase storage
          const fileBuffer = await fetch(fileURL).then((res) =>
            res.arrayBuffer()
          );
          await supabase.storage
            .from("images")
            .upload(`${userId}.jpg`, fileBuffer, {
              contentType: "image/jpg",
              upsert: true,
            });
          photo_path = `${userId}.jpg`;
        }
        const { error } = await supabase
          .from("users")
          .update({ photo_path, step: step + 1 })
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
