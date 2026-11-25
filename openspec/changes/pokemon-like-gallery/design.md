# Design

## Context

The React/Vite frontend scaffold exists, but it has no catalog or backend integration yet. See `proposal.md` for the motivation and `specs/pokemon-gallery/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**
- Keep the initial implementation small while supporting account-specific likes across devices.
- Let visitors explore and like Pokémon before creating an account.
- Merge a visitor's in-memory likes into their account if they sign in during the visit.
- Load at least 100 Pokémon entries from PokeAPI at runtime.
- Use PokeAPI artwork when available and retain generic local artwork as a fallback.

**Non-Goals:**
- Build a custom authentication server.
- Add search or social features.
- Bundle PokeAPI sprites without a verified image license.

## Decisions

- **Use React with Vite for the frontend and Supabase for managed authentication and PostgreSQL.** A browser-based frontend avoids the complexity of a custom application server. Supabase combines managed accounts and relational storage; a custom backend would add deployment and credential-handling work, while a document store is less natural for unique user-to-Pokémon likes. Use the managed email/password flow as the default rather than configuring a separate OAuth provider.
- **Load catalog metadata from PokeAPI at runtime.** Request the first 100 entries from `https://pokeapi.co/api/v2/pokemon?limit=100` when opening the gallery. This follows the requested live source instead of maintaining a local copy.
- **Load artwork URLs from each PokeAPI Pokémon detail resource.** Prefer `sprites.other.official-artwork.front_default`, then `sprites.front_default`, and use the local placeholder when neither URL is available. The project owner confirms authorization to display these sprites; the app references the remote files rather than bundling them.
- **Represent likes as account-owned rows.** Store a user ID and Pokémon ID with a uniqueness constraint on the pair. Use database row-level security so a signed-in user can read or change only their own likes; do not expose any privileged service key in the browser.
- **Keep guest likes in memory.** Visitors can like and unlike immediately without an account; those likes disappear on reload. Signing in during the visit merges them into the account for cross-device persistence.
- **Show loading and recoverable error states for catalog requests.** If PokeAPI is unavailable, keep the failure visible and let the visitor retry rather than showing an empty gallery as if it loaded successfully.

## Risks / Trade-offs

- **PokeAPI or managed-service outage** -> Show a clear retryable catalog error; show a clear error when authentication or saving likes fails.
- **Incorrect access policy could expose or alter another user's likes** -> Enforce ownership in database row-level security and verify with separate test accounts.
- **A Pokémon detail resource has no image, or its image request fails** -> Use the generic local placeholder for that card.

## Migration Plan

1. Create the Supabase project and configure managed email authentication.
2. Add a database migration for account-owned likes and row-level security policies.
3. Add the PokeAPI catalog request and local generic placeholder, then configure the public client settings for the deployment environment.
4. Verify guest browsing, catalog loading and retry behavior, sign-in, like/unlike behavior, and retrieval on a second device/account session before release.

Because this is a new project, rollback can redeploy the previous frontend version; the likes table can remain unused without affecting it.

