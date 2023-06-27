// This functions is triggered by the cloudconvert webhook
// https://cloudconvert.com/api/v2/webhooks#webhooks-events

import { serve } from "http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../_shared/db_types.ts";

console.log(`Function "generate-experience" up and running!`);

const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (Number(Deno.env.get("DISABLE_CLOUD_SERVICES"))) {
    console.log("Cloud services are disabled!");
    return new Response("ok");
  }

  const payload = await req.json();
  const {
    event,
    job: { tasks },
  } = payload;

  // TODO validate cloudconvert signature header
  if (event !== "job.finished") return new Response("ok");

  // Job is finished, let's get mp3 URL
  const { url, filename }: { url: string; filename: string } = (
    tasks as Array<{ [key: string]: any }>
  ).filter((i) => i.operation === "export/url")[0].result.files[0];
  console.log({ url, filename });
  const userId = filename.replace(".mp3", "");
  const fileBlob = await fetch(url).then((res) => {
    console.log("fetch mp3 response", res);
    return res.blob();
  });
  // Upload to supabase storage
  await supabase.storage
    .from("experiences")
    .upload(filename, fileBlob, { upsert: true });
  // Translate with OpenAI whisper!
  const body = new FormData();
  body.append("file", fileBlob, filename);
  body.append("model", "whisper-1");
  body.append("prompt", "Translate any detected language into English.");
  body.append("temperature", "0.2");
  const translationResponse = await fetch(
    "https://api.openai.com/v1/audio/translations",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        // "Content-Type": "multipart/form-data", TODO: file bug with OpenAI team.
      },
      body,
    }
  ).then((res) => {
    console.log("translationresponse", res);
    return res.json();
  });
  console.log("parsed translationResponse", translationResponse);
  // Store experience
  await supabase
    .from("users")
    .update({
      experience: translationResponse.text ?? null,
    })
    .eq("id", userId);

  return new Response("ok");
});
