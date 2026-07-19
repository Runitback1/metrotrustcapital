# Backup and Restore

Use this workflow to keep a restorable copy of code and SQL before major changes.

## Create backup package

```bash
./scripts/backup-and-export.sh
```

This generates a timestamped folder under `backups/` with:
- compressed project archive (`.tar.gz`)
- complete git history bundle (`.bundle`)
- SQL snapshot built from local `sql/*.sql`
- optional live Supabase public schema export (if Supabase CLI is linked)

## Restore code from archive

```bash
mkdir -p ~/restore-metrotrust
tar -xzf backups/<timestamp>/metrotrust-app-<timestamp>.tar.gz -C ~/restore-metrotrust
```

## Restore git history from bundle

```bash
git clone backups/<timestamp>/metrotrust-app-<timestamp>.bundle metrotrust-restored
```

## Restore SQL to Supabase

Run in Supabase SQL editor or with CLI:

```bash
psql "<your-connection-string>" -f backups/<timestamp>/sql/local-schema-snapshot.sql
```

If available, prefer the live dump:

```bash
psql "<your-connection-string>" -f backups/<timestamp>/sql/supabase-public-schema.sql
```
