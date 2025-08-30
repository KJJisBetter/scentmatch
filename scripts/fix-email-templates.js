#!/usr/bin/env node

/**
 * Fix Supabase Email Templates for PKCE Flow
 *
 * This script updates the email templates in Supabase to use the correct
 * format for PKCE flow authentication, fixing the broken email confirmation.
 *
 * Required environment variables:
 * - SUPABASE_ACCESS_TOKEN: Get from https://supabase.com/dashboard/account/tokens
 * - PROJECT_REF: yekstmwcgyiltxinqamf (ScentMatch project)
 */

const https = require('https');

const PROJECT_REF = 'yekstmwcgyiltxinqamf';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Missing SUPABASE_ACCESS_TOKEN environment variable');
  console.error(
    'Get your token from: https://supabase.com/dashboard/account/tokens'
  );
  process.exit(1);
}

// Correct email template configuration for PKCE flow
const emailTemplateConfig = {
  // Confirmation email (signup)
  mailer_subjects_confirmation: 'Confirm Your ScentMatch Account',
  mailer_templates_confirmation_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your ScentMatch Account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ScentMatch</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0;">Discover Your Perfect Fragrance</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #1f2937; margin-top: 0;">Welcome to ScentMatch!</h2>
    <p style="margin-bottom: 20px;">Thank you for signing up! To complete your registration and start discovering your perfect fragrances, please confirm your email address.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}" 
         style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
        Confirm Email Address
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}" style="color: #2563eb; word-break: break-all;">
        {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}
      </a>
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>This link will expire in 24 hours for security reasons.</p>
    <p>If you didn't create a ScentMatch account, you can safely ignore this email.</p>
  </div>
</body>
</html>`.trim(),

  // Magic Link email
  mailer_subjects_magic_link: 'Your ScentMatch Login Link',
  mailer_templates_magic_link_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ScentMatch Login Link</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ScentMatch</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0;">Discover Your Perfect Fragrance</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #1f2937; margin-top: 0;">Sign in to ScentMatch</h2>
    <p style="margin-bottom: 20px;">Click the link below to securely sign in to your ScentMatch account:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next={{ .RedirectTo }}" 
         style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
        Sign In to ScentMatch
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next={{ .RedirectTo }}" style="color: #2563eb; word-break: break-all;">
        {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next={{ .RedirectTo }}
      </a>
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>If you didn't request this login link, you can safely ignore this email.</p>
  </div>
</body>
</html>`.trim(),

  // Password Recovery
  mailer_subjects_recovery: 'Reset Your ScentMatch Password',
  mailer_templates_recovery_content: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your ScentMatch Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin: 0;">ScentMatch</h1>
    <p style="color: #6b7280; margin: 5px 0 0 0;">Discover Your Perfect Fragrance</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
    <p style="margin-bottom: 20px;">We received a request to reset the password for your ScentMatch account. Click the link below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}" 
         style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
        Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}" style="color: #2563eb; word-break: break-all;">
        {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}
      </a>
    </p>
  </div>
  
  <div style="text-align: center; color: #6b7280; font-size: 12px;">
    <p>This link will expire in 1 hour for security reasons.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
</body>
</html>`.trim(),
};

function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/config/auth`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, res => {
      let responseData = '';

      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: responseData });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function updateEmailTemplates() {
  console.log('🚀 Starting Supabase email template update...');
  console.log(`📧 Project: ${PROJECT_REF}`);
  console.log(`🔑 Using token: ${SUPABASE_ACCESS_TOKEN.substring(0, 10)}...`);

  try {
    console.log(
      '\n📝 Updating email templates with PKCE flow configuration...'
    );

    const response = await makeRequest(emailTemplateConfig);

    console.log('✅ Email templates updated successfully!');
    console.log(`📊 Response status: ${response.status}`);

    console.log('\n🎉 Email templates have been fixed!');
    console.log('📧 Users can now confirm their email addresses properly');
    console.log(
      '🔗 Links will redirect to: /auth/confirm?token_hash=...&type=signup&next=...'
    );
  } catch (error) {
    console.error('❌ Failed to update email templates:');
    console.error(error.message);

    if (error.message.includes('401')) {
      console.error('\n🔑 Authentication error:');
      console.error('- Check your SUPABASE_ACCESS_TOKEN is valid');
      console.error(
        '- Generate a new token at: https://supabase.com/dashboard/account/tokens'
      );
    } else if (error.message.includes('403')) {
      console.error('\n🚫 Permission error:');
      console.error('- Your token needs "projects.write" permissions');
      console.error('- Make sure you own this project');
    } else if (error.message.includes('404')) {
      console.error('\n❓ Project not found:');
      console.error(`- Check project reference: ${PROJECT_REF}`);
      console.error('- Verify the project exists and is accessible');
    }

    process.exit(1);
  }
}

// Run the script
updateEmailTemplates();
