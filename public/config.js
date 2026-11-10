/* SMISKEE configuration.
   These values are public by design: the publishable key only allows what the
   database's row level security and functions permit (see supabase/schema.sql).
   If the repository variables SUPABASE_URL and SUPABASE_ANON_KEY are set,
   the deploy workflow overwrites this file with them.
   Empty values run SMISKEE in demo mode (data kept in the browser only). */
window.SMISKEE_CONFIG = {
  supabaseUrl: "https://aroseiknhnrczwagnzau.supabase.co",
  supabaseAnonKey: "sb_publishable_BRWTOwaiilVO95BQPnfxHQ_OQukp9Dy",
  staffEmailDomain: "staff.smiskee.app"
};
