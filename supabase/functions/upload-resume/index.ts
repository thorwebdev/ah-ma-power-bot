// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "@supabase/supabase-js";
import { Bot, InputFile } from "grammy";
import { serve } from "http/server.ts";
import { Configuration, OpenAIApi } from "openai-edge";
import showdown from "showdown";
import { Database } from "../_shared/db_types.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");
const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const converter = new showdown.Converter();

type UserRecord = Database["public"]["Tables"]["users"]["Row"];
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: UserRecord;
  schema: "public";
  old_record: null | UserRecord;
}

const configuration = new Configuration({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const openai = new OpenAIApi(configuration);

console.log(`Function "upload-resume" up and running!`);

//retrieve stored resume
serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const user = payload.record;
    // Retrieve user details if final step is reached
    if (user.resume_markdown || user.step !== 4) return new Response("ok");

    //retrive details to upload resume
    const {data, error} = await supabase
        .from("users")
        .select("id")
        .eq(user.id);

    const {name, phone, email, resume} = data;

    //open selenium web driver to upload the resume onto silverjobs

      // Convert to PDF
      const pdfArrayBuffer = await fetch(
        `https://chrome.browserless.io/pdf?token=${Deno.env.get(
          "BROWSERLESS_API_KEY"
        )}`,
        {
          method: "POST",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            html: htmlContent,
            options: {
              displayHeaderFooter: true,
              printBackground: false,
              format: "A4",
            },
          }),
        }
      ).then((res) => {
        console.log(res);
        return res.blob();
      });

      // TODO upload to supabase storage
      // Send in telegram
      const pdfFile = new InputFile(pdfArrayBuffer, `${user.name}-resume.pdf`);
      // Case 1: collate the resumes in a fake email

      // Case 2: open selenium webdriver and send the resume via drag and drop
      await bot.api.sendDocument(
        user.id,
        new InputFile(pdfArrayBuffer, `${user.name}-resume.pdf`)
      );
    }
  } catch (e) {
    console.log(e);
  }
  return new Response("ok");
});
