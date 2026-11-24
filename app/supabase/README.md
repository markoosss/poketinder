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
