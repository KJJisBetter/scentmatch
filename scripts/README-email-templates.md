# Supabase Email Template Fix for PKCE Flow

This directory contains scripts to fix broken email confirmation in ScentMatch by updating Supabase email templates to use the correct PKCE flow format.

## Problem

The default Supabase email templates generate links in this format:

```
https://yekstmwcgyiltxinqamf.supabase.co/auth/v1/verify?token=pkce_...&type=signup&redirect_to=...
```

This doesn't work with the PKCE flow. The correct format should redirect to your app's auth handler:

```
https://scentmatch.app/auth/confirm?token_hash=...&type=signup&next=...
```

## Solutions

### Option 1: Automated Script (Recommended)

**Bash Script** (Linux/Mac):

```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your_token_here"

# Run the script
./scripts/fix-email-templates.sh
```

**Node.js Script** (Cross-platform):

```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your_token_here"

# Run the script
node scripts/fix-email-templates.js
```

### Option 2: Manual Dashboard Fix

If you prefer to update manually via Supabase Dashboard:

1. Go to [Supabase Dashboard → Authentication → Email Templates](https://supabase.com/dashboard/project/yekstmwcgyiltxinqamf/auth/templates)

2. **Confirm signup template** - Replace the content with:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Confirm Your ScentMatch Account</title>
  </head>
  <body
    style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"
  >
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0;">ScentMatch</h1>
      <p style="color: #6b7280; margin: 5px 0 0 0;">
        Discover Your Perfect Fragrance
      </p>
    </div>

    <div
      style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;"
    >
      <h2 style="color: #1f2937; margin-top: 0;">Welcome to ScentMatch!</h2>
      <p style="margin-bottom: 20px;">
        Thank you for signing up! To complete your registration and start
        discovering your perfect fragrances, please confirm your email address.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a
          href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}"
          style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;"
        >
          Confirm Email Address
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
        If the button doesn't work, copy and paste this link into your
        browser:<br />
        <a
          href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}"
          style="color: #2563eb; word-break: break-all;"
        >
          {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash
          }}&type=signup&next={{ .RedirectTo }}
        </a>
      </p>
    </div>

    <div style="text-align: center; color: #6b7280; font-size: 12px;">
      <p>This link will expire in 24 hours for security reasons.</p>
      <p>
        If you didn't create a ScentMatch account, you can safely ignore this
        email.
      </p>
    </div>
  </body>
</html>
```

### Option 3: cURL Command

Direct API call:

```bash
export SUPABASE_ACCESS_TOKEN="your_token_here"
export PROJECT_REF="yekstmwcgyiltxinqamf"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Confirm Your ScentMatch Account",
    "mailer_templates_confirmation_content": "<!DOCTYPE html>...your template here..."
  }'
```

## Getting Your Access Token

1. Go to [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens)
2. Click "Generate new token"
3. Name it "Email Template Fix"
4. Set scopes to include `projects.write`
5. Copy the token (it's only shown once!)

## Verification

After running the script:

1. **Test signup flow:**

   ```bash
   # Try signing up a new user
   # Check that the confirmation email has the correct link format
   ```

2. **Check email template in dashboard:**
   - Go to [Email Templates](https://supabase.com/dashboard/project/yekstmwcgyiltxinqamf/auth/templates)
   - Verify the "Confirm signup" template shows your custom HTML

3. **Monitor auth handler:**
   ```bash
   # Check logs for your auth handler at /auth/confirm/route.ts
   # Should show successful token verification
   ```

## Troubleshooting

**401 Unauthorized:**

- Check your `SUPABASE_ACCESS_TOKEN` is valid
- Generate a new token with `projects.write` permissions

**403 Forbidden:**

- Make sure you own the project
- Verify token has correct permissions

**404 Not Found:**

- Check project reference `yekstmwcgyiltxinqamf` is correct
- Ensure project exists and is active

**Template not working:**

- Verify your `/auth/confirm/route.ts` handler exists and is correct
- Check Site URL in Supabase settings matches your domain
- Test with different email types (signup vs magic link)

## Background

This fix addresses the common PKCE flow issue where:

1. Default Supabase templates redirect to `supabase.co/auth/v1/verify`
2. This works for implicit flow but breaks with PKCE
3. PKCE requires custom redirect to your app's auth handler
4. Your handler then calls `supabase.auth.verifyOtp()` to complete verification

The corrected templates redirect to `{{ .SiteURL }}/auth/confirm` which properly handles PKCE token exchange.
