// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "@supabase/supabase-js";
import { serve } from "http/server.ts";
import { prompts } from "../_shared/translations.ts";
import { Database } from "../_shared/db_types.ts";

console.log(`Function "telegram-bot" up and running!`);

import { Bot, InlineKeyboard, webhookCallback } from "grammy";

const telegramBotToken = Deno.env.get("BOT_TOKEN");
const bot = new Bot(telegramBotToken || "");
const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Construct a keyboard.
const inlineKeyboard = new InlineKeyboard()
  .text("English", "language:en")
  .row()
  .text("中文", "language:cn")
  .row()
  .text("Melayu", "language:ms")
  .row()
  .text("தமிழ்", "language:ta")
  .row();

// Send a keyboard along with a message.
bot.command("start", async (ctx) => {
  await ctx.reply(prompts({ key: "welcome", language: "en" }), {
    reply_markup: inlineKeyboard,
  });
});

// Handle button callback
bot.on("callback_query:data", async (ctx) => {
  const [key, value] = ctx.callbackQuery.data.split(":");
  const chatId = ctx.chat?.id;
  if (chatId && key === "language") {
    try {
      // Delete old record if ther is one
      await supabase.from("users").delete().eq("id", chatId);
      // Create new record
      await supabase.from("users").insert({ id: chatId, language: value });
      await ctx.answerCallbackQuery();
      return ctx.api.sendMessage(
        chatId,
        prompts({ key: "step-0", language: value })
      );
    } catch {
      return ctx.api.sendMessage(
        chatId,
        "Sorry, this language is not yet supported!"
      );
    }
  } else if (chatId && key == "approval") {
    // Set approved to true to trigger email sending
    await supabase.from("users").update({ approved: true }).eq("id", chatId);
    await ctx.api.sendMessage(
      chatId,
      prompts({ key: "step-final", language: value })
    );
    return await ctx.answerCallbackQuery();
  }
});

// Handle incoming messages
bot.on("message", async (ctx) => {
  const message = ctx.message; // the message object
  const userId = ctx.from.id;
  try {
    // Get user record from database
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("id", userId)
      .maybeSingle();
    if (!data || error) {
      console.log(`Error ${error?.message ?? "no data"} for user ${userId}`);
      return ctx.api.sendMessage(
        userId,
        prompts({ key: "error", language: "en" })
      );
    }
    // Handle steps
    const { step, language } = data;
    switch (step) {
      case 0: {
        // Collect name
        const { error } = await supabase
          .from("users")
          .update({ name: message.text!, step: step + 1 })
          .eq("id", userId);
        if (error) {
          console.log(`Error ${error.message} for user ${userId}`);
          return ctx.api.sendMessage(
            userId,
            prompts({ key: "error", language })
          );
        }
        return ctx.api.sendMessage(
          userId,
          prompts({ key: "step-1", text: message.text, language })
        );
      }
      case 1: {
        // Collect mobile number
        const { error } = await supabase
          .from("users")
          .update({ phone_number: message.text!, step: step + 1 })
          .eq("id", userId);
        if (error) {
          console.log(`Error ${error.message} for user ${userId}`);
          return ctx.api.sendMessage(
            userId,
            prompts({ key: "error", language })
          );
        }
        return ctx.api.sendMessage(
          userId,
          prompts({ key: "step-2", language })
        );
      }
      case 2: {
        //Collect age
        const { error } = await supabase
          .from("users")
          .update({ age: Number(message.text!), step: step + 1 })
          .eq("id", userId);
        if (error) {
          console.log(`Error ${error.message} for user ${userId}`);
          return ctx.api.sendMessage(
            userId,
            prompts({ key: "error", language })
          );
        }
        return ctx.api.sendMessage(
          userId,
          prompts({ key: "step-3", language })
        );
      }
      case 3: {
        //  Check if we have audio recording
        if (!message.text && !Number(Deno.env.get("DISABLE_CLOUD_SERVICES"))) {
          const file = await ctx.getFile();
          const fileURL = `https://api.telegram.org/file/bot${telegramBotToken}/${file.file_path}`;
          const filename = file.file_path?.split("/")[1];
          // Convert audio
          const headers = {
            Authorization: `Bearer ${Deno.env.get("CLOUDCONVERT_API_KEY")}`,
            "Content-type": "application/json",
            accept: "application/json",
          };
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
        }
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
            prompts({ key: "error", language })
          );
        }
        return ctx.api.sendMessage(
          userId,
          prompts({ key: "step-4", language })
        );
      }
      case 4: {
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
            prompts({ key: "error", language })
          );
        }
        ctx.api.sendMessage(userId, prompts({ key: "step-5", language }));
        return ctx.api.sendSticker(
          userId,
          "CAACAgQAAxkBAAEi6x9kmXxaAa9YSX-R-HLqSykB5Eh2HwACEQADwSr1H-LzA6AOf05zLwQ"
        );
      }
      default: {
        console.log(`Unhandled step: ${step}`);
        return ctx.api.sendMessage(userId, prompts({ key: "error", language }));
      }
    }
  } catch (error) {
    console.log(`Caught Error ${error.message}`);
    return ctx.api.sendMessage(
      userId,
      prompts({ key: "error", language: "en" })
    );
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
