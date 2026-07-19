# Reusable Skeleton Workflow

This project can be reused as a starter for future projects.

## Create a clean skeleton copy

From the app folder, run:

```bash
./scripts/create-skeleton.sh
```

Optional custom output path:

```bash
./scripts/create-skeleton.sh ../my-next-app-starter
```

What it excludes automatically:
- local git metadata
- node_modules
- build output
- env files
- temporary zip/artifact files

What it adds:
- .env.example (keys only, no values)

## Start a new project from the skeleton

```bash
cd ../my-next-app-starter
git init
npm install
npm run build
```

Then update:
- branding text
- support email/domain
- Supabase project URL/keys
- SEO metadata in public/index.html

## Zoho Mail next checklist

1. Create mailbox users in Zoho Mail Admin.
2. Add Zoho MX records in Cloudflare DNS.
3. Add SPF TXT record.
4. Add DKIM TXT record from Zoho.
5. Add DMARC TXT record.
6. Verify domain in Zoho.
7. Test send and receive from Gmail and Outlook.

Recommended DMARC starter value:

```txt
v=DMARC1; p=none; rua=mailto:dmarc@metrotrustcapital.com; fo=1; adkim=s; aspf=s
```

After 7 to 14 days with good results, tighten policy to quarantine, then reject.
