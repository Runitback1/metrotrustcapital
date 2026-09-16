# Deploy the secure admin email-update function

The Admin **Update Email** button now changes both the MetroTrust account email and the Supabase Auth login email. The function uses Supabase's server-only service-role key; do not add that key to any `.env` file used by React.

From the `metrotrust-app` folder, run these commands exactly:

```bash
npx supabase login
npx supabase link --project-ref sssiuusragfwlpqpafjt
npx supabase functions deploy admin-update-email
```

Then deploy the website normally. No SQL is required.

To test: sign in as `admin@metrotrust.com`, open the account, enter the new email, and select **Update Email**. Sign out and use the new email with the existing password.
