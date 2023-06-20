// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "http/server.ts";
import { Configuration, OpenAIApi, ResponseTypes } from "openai-edge";
import { createClient } from "@supabase/supabase-js";
import { Bot, InputFile } from "grammy";
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

console.log(`Function "generate-resume" up and running!`);

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const user = payload.record;
    // Retrieve user details if final step is reached
    if (user.resume_markdown || user.step !== 4) return new Response("ok");

    // Construct the prompt
    const prompt = `
    Given the following context, generate a one page resume in Markdown format. 

    If there is a photo, include it at the top.

    Include a callout as Markdown block quote about the "NEW PART-TIME RE-EMPLOYMENT GRANT (UP TO $125,000 PER COMPANY)" when employing a senior worker aged 60 years and above with a link to https://www.wsg.gov.sg/docs/default-source/content/programmes-and-initiatives/senior-worker-early-adopter-grant-and-part-time-re-employment-grant-employers/new-ptrg-factsheet.pdf?sfvrsn=586dc2eb_0 titled "more details".
    
    Expand the experience section to include a paragraph for each bullet point but don't invent any facts.

    CONTEXT:
    ${user.photo_url ? `- Photo: ${user.photo_url}` : ""}
    - Personal Particulars:
      - Name: ${user.name}
      - Age: ${user.age} (include the birth year)
    - Contact Information:
      - Phone: 12345678 (phone communication preferred)
      - Postal code: 460503
    - Experience:
      - 10 years driving fork lift (has license)
      - 10 years facility management
    - Skills:
      - speaks english
      - speaks and writes mandarin
  `;
    // Request the OpenAI API for the response based on the prompt
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      stream: false,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2200,
      temperature: 0,
    });

    const data =
      (await response.json()) as ResponseTypes["createChatCompletion"];
    const markdownContent = data.choices[0].message?.content;
    if (markdownContent) {
      const htmlContent = converter.makeHtml(markdownContent);
      // Write to db
      await supabase
        .from("users")
        .update({ resume_markdown: markdownContent, resume_html: htmlContent })
        .eq("id", user.id);
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