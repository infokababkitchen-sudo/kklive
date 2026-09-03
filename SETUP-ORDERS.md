# Orders panel setup

Neon and Blob are already connected, so this is short.

Until step 2 finishes, the site behaves exactly as it does today: orders go to
WhatsApp and nothing breaks.

## 1. Install

```bash
npm install
```

## 2. Get the connection string onto your machine

Vercel already holds it. Pull everything down:

```bash
npx vercel env pull .env.local
```

That writes `.env.local` with your Neon and Blob variables. The `vercel`
command is not installed globally on your Mac, which is why this uses `npx`.

If that does not work, open the Neon dashboard, copy the pooled **Connection
string**, and put it in `.env` yourself:

```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

Either variable name works. The app looks for `DATABASE_URL`, `POSTGRES_URL`,
`DATABASE_URL_UNPOOLED`, `POSTGRES_URL_NON_POOLING` and `POSTGRES_PRISMA_URL`,
because Vercel's Neon integration picks different names depending on how it
was added.

## 3. Create the tables and your login

One command, from the repo root:

```bash
node db/setup.js you@kababkitchen.com "Owner" your-password
```

Password must be at least 8 characters. It prints the tables it created and
confirms the login.

Nothing to paste into the Neon SQL editor. The script reads `db/schema.sql`
and runs it for you. Running it again is harmless: every statement is
`CREATE TABLE IF NOT EXISTS`, and it refuses to create a second account.

To create the tables without a login yet, drop the arguments:

```bash
node db/setup.js
```

## Managing accounts

```bash
node db/setup.js list                            # who can sign in
node db/setup.js add admin "Owner" the-password  # add someone
node db/setup.js reset admin new-password        # change a password
node db/setup.js remove old-user                 # delete an account
```

A username works as well as an email, so `admin` is fine. Passwords need at
least 8 characters. Resetting a password signs that person out everywhere.

## 4. Turn the panel on

```bash
npm run dev
```

Open `/admin`, sign in with your username and password, go to the **Orders**
tab and tick **Show orders in this panel**, then Save.

The admin key still works if you need it: tap **Use the admin key instead** on
the sign-in screen.

Every order now goes to both WhatsApp and the panel.

## Before you push

```bash
git status
```

`.env` and `.env.local` must not appear. They hold your database password.
Both are already in `.gitignore`, but check anyway.

## Using the panel

- It polls every 10 seconds. A new order cannot appear instantly, because a
  serverless host cannot push to the browser.
- Tap **Turn on the order alarm** once per session. Browsers refuse to play
  sound before a tap. After that it repeats every 3 seconds while anything is
  unaccepted, and stops the moment you accept.
- Flow: New → Accepted → Preparing → Out for delivery → Delivered. A new order
  can also be rejected.
- The date box switches to that day's history. Clear it to go back to live.
- **Receipt** opens a print view sized for a thermal roll.

## Keep WhatsApp on

The panel is convenience; WhatsApp is the safety net. If the tab is closed, the
laptop sleeps or the internet drops, the panel goes quiet and an order can be
missed. Your phone still buzzes. That is why the toggle feeds both rather than
switching between them.
