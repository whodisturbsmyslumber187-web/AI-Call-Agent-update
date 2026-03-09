

# Plan: Add Direct Bot Token Input & Fix Telegram Settings

## Problem
The edge function looks up the bot token via `Deno.env.get(config.bot_token_secret_name)` but the secret may not be accessible. Users also can't change their token directly from settings — they have to ask in chat.

## Solution

### 1. Database Migration
Add a `bot_token` column to `telegram_config` to store the token directly (encrypted at rest by the database). The edge function will use this as the primary source, falling back to the env secret.

```sql
ALTER TABLE public.telegram_config ADD COLUMN bot_token text DEFAULT '';
```

### 2. Update Edge Function (`supabase/functions/telegram-bot/index.ts`)
Change the token resolution logic (line 24, 41, 76) from:
```ts
const botToken = Deno.env.get(config.bot_token_secret_name) || "";
```
to:
```ts
const botToken = config.bot_token || Deno.env.get(config.bot_token_secret_name) || "";
```

This way, a directly-entered token takes priority, with the env secret as fallback.

### 3. Update Settings UI (`src/components/settings/TelegramConfigSection.tsx`)
- Add a `bot_token` field to the form state
- Add a password-type input field labeled "Bot Token (from BotFather)" where users can paste their token directly
- Show/hide toggle for the token field
- Include the `bot_token` in the save payload
- Remove the "secret name" field (or move it to an advanced/collapsible section) since direct input is simpler

### Files Changed
1. SQL migration — add `bot_token` column
2. `supabase/functions/telegram-bot/index.ts` — 3 lines changed (token resolution)
3. `src/components/settings/TelegramConfigSection.tsx` — add direct token input field, update form state and save logic

