import { serve } from "http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../_shared/db_types.ts";

console.log(`Function "send-email" up and running!`);

type UserRecord = Database["public"]["Tables"]["users"]["Row"];
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: UserRecord;
  schema: "public";
  old_record: null | UserRecord;
}

const supabase = createClient<Database>(
  // Supabase API URL - env var exported by default when deployed.
  Deno.env.get("SUPABASE_URL") ?? "",
  // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (Number(Deno.env.get("DISABLE_CLOUD_SERVICES"))) {
    console.log("Cloud services are disabled!");
    return new Response("ok");
  }

  const payload: WebhookPayload = await req.json();
  const user = payload.record;

  if (user.approved) {
    // Send resume
    const { data } = await supabase.storage
      .from("resumes")
      .createSignedUrl(`${user.id}.pdf`, 60);
    if (!data) {
      console.log(`Error: resume for ${user.id} not found!`);
      return new Response("ok");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: "ahmapowerbfg@gmail.com",
        subject: `Elderly looking for Jobs - ${user.name}`,
        html: "<strong>Elderly Looking for suitable Jobs!</strong>",
        attachments: [
          {
            filename: `${user.name}-resume.pdf`,
            path: data.signedUrl,
          },
        ],
      }),
    });
    console.log("resend res", res);
  }

  return new Response("ok");
});
