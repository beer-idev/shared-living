# Shared Living

A shared house app for expenses, chores, appreciation, celebrations, and notifications.

## Stack

- Next.js App Router with authenticated Server Actions
- Firebase Authentication for email and password accounts
- Cloud Firestore for houses, members, expenses, tasks, scores, and notifications
- Vercel Blob for receipt and task proof photos
- Vercel Cron for task due reminders and overdue penalties

## Set up

1. Create a Firebase project. Enable Authentication > Email/Password and create a Cloud Firestore database.
   Deploy the included `firestore.rules` to enable the scoped member/owner permissions for Firebase client SDK requests.
2. Create a Firebase service account and copy .env.example to .env.local. Set the project ID, web API key, service account email and private key. Keep the private key server side.
3. Create a Vercel Blob store and connect it to the project with OIDC. For local development, connect the same store to the Development environment with the `DEV_BLOB` prefix, then run `vercel env pull .env.development.local --environment=development`.
4. Set a random CRON_SECRET in Vercel. The scheduled route requires Authorization: Bearer <CRON_SECRET>.
5. Set the same environment variables in Vercel, deploy, and open /register.

For local development, run npm install and npm run dev.

The Firebase Admin SDK uses the service account variables when present. For local Google Application Default Credentials, the project ID and web API key are still required.

## Firestore access and CRUD

`firestore.rules` validates the fields and access for collections mapped from the previous Supabase schema. Firestore is schemaless, so these rules validate document shapes; they do not create SQL tables or columns. They apply to Firebase web/mobile SDK requests. This app uses HTTP-only Firebase session cookies and performs UI reads and writes through authenticated server actions using Firebase Admin, which bypasses Firestore Rules. Those server actions must continue checking the signed-in user, house membership, and owner/assignee permissions. Task completion, overdue penalties, the first-reaction score award, and generated notifications are server-only so their related changes stay in one trusted workflow. Keep the rules deployed with `firebase deploy --only firestore:rules`.

The table-to-collection mapping follows `supabase/migrations/202609250001_initial_schema.sql`:

| Supabase table | Firestore collection | Notes |
| --- | --- | --- |
| `profiles` | `profiles` | Firebase Auth UID is the document ID. |
| `houses` | `houses` | House UUID is the document ID. |
| `house_members` | `house_members` | User UID is the document ID; `points` is a derived cached total from the ledger. |
| `expenses` | `expenses` | One document per bill. |
| `expense_splits` | `expense_splits` | Separate documents, linked by `expense_id`; `house_id` is copied for secure house queries. |
| `tasks` | `tasks` | One document per task. |
| `task_reactions` | `task_reactions` | Separate documents, linked by `task_id`; one reaction per member/task. |
| `harmony_events` | `harmony_events` | Append-only score ledger. |
| `celebrations` | `celebrations` | One document per celebration. |
| `notifications` | `notifications` | One document per recipient and event. |

`invite_codes` is an extra lookup collection used by join links; it indexes `houses.invite_code` and is not a former Supabase table.

The previous Supabase database and accounts are not read by the new application. Existing users need Firebase accounts; existing records require a separate export and import into Firestore.

## Migrate existing Supabase data

The repository includes a one-time importer. It keeps existing user IDs, house and record IDs so relationships remain intact, copies receipt/task images from Supabase Storage into Vercel Blob, and creates Firebase email/password accounts with random temporary passwords. Users must use **Forgot password?** on the login page before their first Firebase sign-in.

1. Add the source Supabase URL and a server-only service role/secret key to `.env.local`. Also configure the Firebase service account and Vercel Blob token. Never use the public publishable key as the migration key.
2. Run `npm run migrate:supabase` to fetch records and show a dry-run summary. This does not write to Firebase or Blob.
3. Review that the Firebase destination is empty. Then run `npm run migrate:supabase -- --apply` to copy accounts, records, and supported files.

The importer stops if a user belongs to more than one house because the current app supports one house per account, if destination collections already contain records, or if a stored file is over 5 MB/has an unsupported format. Keep the old Supabase project and storage until the imported app has been checked. Remove the temporary Supabase server key from `.env.local` after migration.

## Seed Firebase demo data

To create the local sample data from `supabase/seed.sql` directly in an empty Firebase project, run a dry check first:

```bash
npm run seed:firebase
```

If the destination is correct and Firestore is empty, apply it with:

```bash
npm run seed:firebase -- --apply
```

This creates four Firebase Auth accounts and the matching Firestore documents. The demo password is `12345678`. The script refuses to write when Firestore already contains documents.

## How data works

- Every user has a Firebase Auth account and a profile document.
- Each user can belong to one house. Firestore membership documents carry their house ID, role, and system points.
- Expense splits are separate documents in `expense_splits`. The payer's share starts paid; each member marks only their own share.
- Task completion requires a photo and awards 10 points once in a Firestore transaction. The first appreciation awards 5 more points once.
- House Harmony changes with these points and loses 5 once for each overdue task when the scheduled job runs. Crossing a level upward opens the celebration choice again, including after a prior drop.
- The daily cron runs at 01:00 UTC (08:00 Bangkok). It sends task reminders for tasks due in the next 24 hours and applies overdue penalties. Cron jobs run on production deployments.

The old SQL files in supabase/ are retained only as a record of the previous schema. They are not used by the app.
