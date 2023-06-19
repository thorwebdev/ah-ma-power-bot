# [grammY](https://grammy.dev) on [Supabase Edge Functions](https://supabase.com/edge-functions)

> Try it out: https://t.me/SGjobsHelperBot

## Run locally

```bash
supabase functions serve --no-verify-jwt --env-file ./supabase/.env
```

In a separate terminal window run

```bash
ngrok http 54321
```

Register the bot webhook

https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-ngrok-url.ngrok.app/telegram-bot?secret=<FUNCTION_SECRET>

## Deploying

1. Create the function:

```shell
supabase functions deploy --no-verify-jwt telegram-bot
```

2. Contact [@BotFather](https://t.me/BotFather) to create a bot and get its
   token.
3. Set the secrets:

```shell
supabase secrets set BOT_TOKEN=your_token FUNCTION_SECRET=random_secret
```

4. Set your bot’s webhook URL to
   `https://<PROJECT_NAME>.functions.supabase.co/telegram-bot` (replacing
   `<...>` with respective values). To do that, you open the request URL in your
   browser:

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<PROJECT_NAME>.functions.supabase.co/telegram-bot?secret=<FUNCTION_SECRET>
```
