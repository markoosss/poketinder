# Supabase database

The migration in `migrations/` creates account-owned Pokémon likes and enables row-level security. Authenticated users can read, insert, and delete only rows whose `user_id` matches their Supabase user ID. The `(user_id, pokemon_id)` primary key prevents duplicate likes.

## Run locally

From `app/`:

```sh
npx supabase start
npx supabase test db
npx supabase stop
```

The pgTAP test in `tests/database/pokemon_likes.test.sql` verifies that one authenticated user cannot read, create, or delete another user's likes.

## Frontend email authentication

Copy `.env.example` to `.env.local`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the local values reported by `npx supabase status`. The Vite client must use only the public anon key; never put the `service_role` or secret key in a `VITE_` variable or commit it.

For the local stack, email confirmations are disabled so the auth smoke test can sign up and sign in immediately. Run `npm run test:auth` with the two environment variables set to verify sign-up, sign-in, and sign-out.
