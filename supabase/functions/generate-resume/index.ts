import { createClient } from "@supabase/supabase-js";
import { Bot, InputFile, InlineKeyboard } from "grammy";
import { serve } from "http/server.ts";
import { Configuration, OpenAIApi, ResponseTypes } from "openai-edge";
import showdown from "showdown";
import { Database } from "../_shared/db_types.ts";
import { prompts } from "../_shared/translations.ts";

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
  if (Number(Deno.env.get("DISABLE_CLOUD_SERVICES"))) {
    console.log("Cloud services are disabled!");
    return new Response("ok");
  }
  try {
    const payload: WebhookPayload = await req.json();
    const user = payload.record;
    // Check if we should send PDF email
    if (user.approved) {
      await supabase.functions.invoke("send-email", { body: payload });
    }
    // Retrieve user details if final step is reached
    if (user.resume_html || user.step !== 5 || !user.experience)
      return new Response("ok");

    if (!user.resume_markdown) {
      // Get a temporary photo url to create the resume
      let photo_url: string | undefined;
      if (user.photo_path) {
        const { data } = await supabase.storage
          .from("images")
          .createSignedUrl(user.photo_path, 60, {
            transform: { width: 200, height: 200, resize: "contain" },
          });
        if (data) photo_url = data.signedUrl;
      }

      // Construct the prompt
      const prompt = `
    - Given the following context, generate a short resume in Markdown format. 
    - If there is a photo, include it at the top.
    - Include a callout as Markdown block quote about the "NEW PART-TIME RE-EMPLOYMENT GRANT (UP TO $125,000 PER COMPANY)" when employing a senior worker aged 60 years and above with a link to https://www.wsg.gov.sg/docs/default-source/content/programmes-and-initiatives/senior-worker-early-adopter-grant-and-part-time-re-employment-grant-employers/new-ptrg-factsheet.pdf?sfvrsn=586dc2eb_0 titled "more details".
    - Calculate all dates based on the current year: ${new Date().getFullYear()}
    - Only use the information provided in the CONTEXT!

    CONTEXT:
    ${photo_url ? `- Photo: ${photo_url}` : ""}
    - Personal Particulars:
      - Name: ${user.name}
      - Age: ${user.age} (include the birth year)
      - Preferred language: ${user.language}
    - Contact Information:
      ${
        user.phone_number
          ? `- Phone: ${user.phone_number}  (phone communication preferred)`
          : ""
      } 
    - Experience: ${user.experience}
  `;
      // Request the OpenAI API for the response based on the prompt
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        stream: false,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2200,
        temperature: 0.2,
      });
      console.log("createChatCompletion", response);
      const data =
        (await response.json()) as ResponseTypes["createChatCompletion"];
      user.resume_markdown = data.choices[0].message?.content ?? null;
    }
    if (user.resume_markdown) {
      const htmlContent = converter.makeHtml(user.resume_markdown);
      // Write to db
      await supabase
        .from("users")
        .update({
          resume_markdown: user.resume_markdown,
          resume_html: htmlContent,
        })
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
      // upload to supabase storage
      await supabase.storage
        .from("resumes")
        .upload(`${user.id}.pdf`, pdfArrayBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });
      // Send in telegram
      await bot.api.sendDocument(
        user.id,
        new InputFile(pdfArrayBuffer, `${user.name}-resume.pdf`)
      );
      // Send permission prompt
      // Construct a keyboard.
      const inlineKeyboard = new InlineKeyboard()
        .text(
          prompts({ key: "apply", language: user.language }),
          `approval:${user.language}`
        )
        .row()
        .text(
          prompts({ key: "restart", language: user.language }),
          `language:${user.language}`
        )
        .row();
      await bot.api.sendMessage(
        user.id,
        prompts({ key: "step-6", language: user.language }),
        {
          reply_markup: inlineKeyboard,
          parse_mode: "MarkdownV2",
        }
      );
    }
  } catch (e) {
    console.log(e);
  }
  return new Response("ok");
});
