# Design

## Context

The React/Vite frontend scaffold exists, but it has no catalog or backend integration yet. See `proposal.md` for the motivation and `specs/pokemon-gallery/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**
- Keep the initial implementation small while supporting account-specific likes across devices.
- Let visitors explore the gallery before creating an account.
- Load at least 100 Pokémon entries from PokeAPI at runtime.
- Keep generic local artwork available while licensed Pokémon images are unavailable.

**Non-Goals:**
- Build a custom authentication server.
- Add search or social features.
- Bundle PokeAPI sprites without a verified image license.

## Decisions

- **Use React with Vite for the frontend and Supabase for managed authentication and PostgreSQL.** A browser-based frontend avoids the complexity of a custom application server. Supabase combines managed accounts and relational storage; a custom backend would add deployment and credential-handling work, while a document store is less natural for unique user-to-Pokémon likes. Use the managed email/password flow as the default rather than configuring a separate OAuth provider.
- **Load catalog metadata from PokeAPI at runtime.** Request the first 100 entries from `https://pokeapi.co/api/v2/pokemon?limit=100` when opening the gallery. This follows the requested live source instead of maintaining a local copy.
- **Use a local generic placeholder for card images.** The API is available for Pokémon data, but its sprites repository does not establish an image license. Do not bundle or display those sprites unless their reuse is authorized; appropriately licensed artwork can replace the placeholder later.
- **Represent likes as account-owned rows.** Store a user ID and Pokémon ID with a uniqueness constraint on the pair. Use database row-level security so a signed-in user can read or change only their own likes; do not expose any privileged service key in the browser.
- **Prompt for sign-in at the like action.** The gallery remains available to visitors; like changes are stored only after authentication.
- **Show loading and recoverable error states for catalog requests.** If PokeAPI is unavailable, keep the failure visible and let the visitor retry rather than showing an empty gallery as if it loaded successfully.

## Risks / Trade-offs

- **PokeAPI or managed-service outage** -> Show a clear retryable catalog error; show a clear error when authentication or saving likes fails.
- **Incorrect access policy could expose or alter another user's likes** -> Enforce ownership in database row-level security and verify with separate test accounts.
- **Image rights are unclear for PokeAPI sprites** -> Use the generic local placeholder until assets with documented permission or an appropriate license are available.

## Migration Plan

1. Create the Supabase project and configure managed email authentication.
2. Add a database migration for account-owned likes and row-level security policies.
3. Add the PokeAPI catalog request and local generic placeholder, then configure the public client settings for the deployment environment.
4. Verify guest browsing, catalog loading and retry behavior, sign-in, like/unlike behavior, and retrieval on a second device/account session before release.

Because this is a new project, rollback can redeploy the previous frontend version; the likes table can remain unused without affecting it.

