# SMISKEE

A motivation web app for bank employees. Staff check in on their stress level each day, play short games (some hosted live by their leaders), earn points for vouchers, and get a weekly recap with motivation for the week ahead.

**Live app:** https://manwest23.github.io/smiskee/

## How it works

| Part | What it is |
| --- | --- |
| `public/` | The app itself: plain HTML, CSS and JavaScript. No build step. |
| `supabase/schema.sql` | The database: tables, privacy rules and the server-side points rules. |
| `.github/workflows/deploy.yml` | Publishes `public/` to GitHub Pages on every push to `main`. |

- **Hosting:** GitHub Pages (free, static).
- **Database and logins:** [Supabase](https://supabase.com) (free tier is enough to start).
- **Sign-in:** staff ID + password. Behind the scenes each staff ID becomes a login like `my-1842@staff.smiskee.app`. No emails are sent.
- **Install:** the app can be added to the home screen on iPhone and Android (it has a manifest, icons and offline support).
- **Demo mode:** with no database connected, or via "Try with a sample employee", everything runs in the browser with sample data.

## Database

This copy is connected to the Supabase project **smiskee** (Singapore). The project URL and publishable key are in [`public/config.js`](public/config.js). They are safe to publish: the database's row level security and functions decide what anyone can do.

## Connect a different database

Follow these steps if you ever move to a new Supabase project.

1. **Create a Supabase project.** Go to [supabase.com](https://supabase.com), sign in, click **New project**, pick the **Southeast Asia (Singapore)** region, and set a database password.
2. **Create the tables.** In the project, open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. You should see "Success. No rows returned".
3. **Turn off email confirmation.** Open **Authentication → Sign In / Providers → Email**, switch **Confirm email** off, and save. (Staff sign in with staff ID and password, so there is no inbox to confirm.)
4. **Copy two values.** Open **Project Settings → API** (or **Data API**) and copy:
   - the **Project URL** (looks like `https://abcd1234.supabase.co`)
   - the **anon public** key (a long string starting with `eyJ`, or a `sb_publishable_…` key)
5. **Point the app at it.** Either edit `public/config.js`, or in this repo go to **Settings → Secrets and variables → Actions → Variables tab → New repository variable** and add (these override `config.js`):
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_ANON_KEY` = the anon public key
6. **Redeploy.** Go to **Actions → Deploy to GitHub Pages → Run workflow**. After about a minute, open the live app and choose **Create account**.

The anon key is designed to be public. The data is protected by row level security in the database: each person can only read their own rows, and every points change goes through a server-side function.

## What the database enforces

- Check-ins: one per day (it can be edited), 20 points the first time.
- Games: points once per game per day, calculated on the server (quiz up to 150, memory up to 100, breathing 80, brain break up to 50).
- Spin & Win: once per day, and the server picks the prize.
- Leader sessions: only leaders can host. Joining a live round gives double quiz points once, plus the Leader Round badge. Live sessions close after 3 hours.
- Rewards: the balance is checked on the server before a coupon code is created.
- Team pulse: leaders see anonymous averages for their department only, and only once 5 or more people have checked in that week.
- Dates follow Malaysia time (Asia/Kuala_Lumpur).

## Admin tasks (SQL Editor)

```sql
-- Make someone a team leader, or change them back
update public.profiles set role = 'leader'   where staff_id = 'MY-1842';
update public.profiles set role = 'employee' where staff_id = 'MY-1842';

-- Reset a forgotten password: delete the login, then the person creates an account again.
-- (This also deletes their history.)
delete from auth.users where email = 'my-1842@staff.smiskee.app';

-- Add or change a reward
insert into public.rewards (id, brand, category, value_rm, points, color, sort)
values ('tealive', 'Tealive', 'Coffee', 10, 600, '#5b2d82', 10)
on conflict (id) do update set points = excluded.points;

-- Hide a reward
update public.rewards set active = false where id = 'kyochon';
```

Anyone can choose **Team leader** when creating an account. If you want to control who is a leader, remove that choice and promote people with the SQL above.

## Run it on your computer

```bash
cd public
python3 -m http.server 8000
# open http://localhost:8000
```

To use your database locally, put your Project URL and anon key in `public/config.js`. Don't commit that change: on GitHub Pages the workflow writes `config.js` from the repository variables.

## Known limits

- The games run on the phone, so a determined person could send a fake score. The server caps every score and only pays once per day, so the most anyone can gain is that day's normal maximum.
- Voucher codes are generated by SMISKEE. To make them redeemable at real outlets, match them with codes from each merchant or your voucher provider.
- Forgotten passwords need an admin (see above), because staff logins have no real email address.
