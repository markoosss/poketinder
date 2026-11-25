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

Visitors can like and unlike Pokémon without an account. Guest likes live only
in page memory and are cleared on reload; signing in during that visit merges
them into the account so they sync across devices.

## End-to-end verification

The gallery checks run with `npm test`. The Supabase integration tests create
temporary users, verify likes persist across independent sessions, and confirm
row-level security prevents a second account from reading, adding, or removing
another user's likes. They only run against a local Supabase URL and delete the
temporary accounts after the test.

From `app/`, load the local values into the current PowerShell session and run
the checks:

```powershell
$values = @{}
npx supabase status -o env | ForEach-Object {
  if ($_ -match '^([^=]+)="?(.*?)"?$') {
    $values[$matches[1]] = $matches[2]
  }
}
$env:VITE_SUPABASE_URL = $values.API_URL
$env:VITE_SUPABASE_ANON_KEY = $values.ANON_KEY
$env:SUPABASE_SERVICE_ROLE_KEY = $values.SERVICE_ROLE_KEY

npm test
npm run test:integration
npx supabase test db
npm run lint
npm run build
```

The service-role key is used only by the local Node integration tests to delete
their temporary accounts. Keep it out of `.env.local`, all `VITE_` variables,
and source control.

Verification performed for this change: 4 catalog tests and 7 gallery tests
passed; both Supabase integration tests passed; all 7 pgTAP checks passed; lint
and the production build completed successfully. A live browser check also
verified 100 cards, account creation, saving a favorite, persistence across a
page reload, removing the favorite, and sign-out; its temporary account was
deleted afterward. Guest likes were also verified to work without a prompt,
clear on reload, and merge into an account after sign-up; that temporary
account was deleted as well.
