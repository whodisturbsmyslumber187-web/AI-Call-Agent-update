

# Plan: Fix Warn-Level Security Issues

Two "warn" findings from the scan need to be addressed.

---

## Issue 1: RLS Policy Always True

**What the linter found:** ~50 tables have "Service role manages..." policies with `USING (true)` / `WITH CHECK (true)`.

**Why it's flagged:** The linter detects any `true` expression in non-SELECT policies regardless of role targeting. However, all these policies are scoped to `service_role` only, which already bypasses RLS. They're redundant.

**Fix:** Drop all "Service role manages..." policies across the ~50 tables. The service role bypasses RLS by design, so these policies do nothing and their removal silences the linter without any functional change.

**Implementation:** A single database migration with `DROP POLICY IF EXISTS` statements for each of the ~50 service_role policies.

---

## Issue 2: Leaked Password Protection Disabled

**What it is:** The authentication system doesn't check new passwords against known breach databases (HaveIBeenPwned). Users can set passwords that have appeared in data breaches.

**Fix:** Enable leaked password protection via the auth configuration tool. This will reject passwords found in breach databases during signup and password changes.

---

## About Your Telegram Bot & API Issues

I noticed you mentioned the Telegram bot and API aren't working. After fixing these warn items, I can help debug those. The Telegram bot requires:
1. A `TELEGRAM_BOT_TOKEN` secret to be set
2. The bot webhook to be pointed at your edge function URL
3. Your chat ID configured in Settings

The Dashboard API requires a valid API key (created in Settings) passed as `Authorization: Bearer ak_xxxxx`.

Want me to help troubleshoot those after fixing the security warnings?

---

## Files Changed
1. **Database migration** -- Drop ~50 redundant service_role RLS policies
2. **Auth config** -- Enable leaked password protection

