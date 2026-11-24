# Design

## Context

This is a new project with no existing application code or technology constraints. See `proposal.md` for the motivation and `specs/pokemon-gallery/spec.md` for the behavior contract.

## Goals / Non-Goals

**Goals:**
- Keep the initial implementation small while supporting account-specific likes across devices.
- Let visitors explore the gallery before creating an account.
- Avoid a runtime dependency on a Pokémon catalog API.

**Non-Goals:**
- Build a custom authentication server.
- Add a live catalog API, search, or social features.

## Decisions

- **Use React with Vite for the frontend and Supabase for managed authentication and PostgreSQL.** A browser-based frontend avoids the complexity of a custom application server. Supabase combines managed accounts and relational storage; a custom backend would add deployment and credential-handling work, while a document store is less natural for unique user-to-Pokémon likes. Use the managed email/password flow as the default rather than configuring a separate OAuth provider.
- **Keep the Pokémon catalog and image assets with the frontend.** A predefined catalog of at least 100 entries avoids API availability and rate-limit concerns. Bundle images that are user-provided or appropriately licensed rather than relying on remote artwork at runtime.
- **Represent likes as account-owned rows.** Store a user ID and Pokémon ID with a uniqueness constraint on the pair. Use database row-level security so a signed-in user can read or change only their own likes; do not expose any privileged service key in the browser.
- **Prompt for sign-in at the like action.** The gallery remains available to visitors; like changes are stored only after authentication.

## Risks / Trade-offs

- **Managed-service outage or network failure** -> The fixed gallery can still render locally; show a clear retryable error when authentication or saving likes fails.
- **Incorrect access policy could expose or alter another user's likes** -> Enforce ownership in database row-level security and verify with separate test accounts.
- **Image rights or external image availability** -> Use local assets with documented permission or an appropriate license.

## Migration Plan

1. Create the Supabase project and configure managed email authentication.
2. Add a database migration for account-owned likes and row-level security policies.
3. Add the fixed catalog and licensed image assets to the frontend, then configure the public client settings for the deployment environment.
4. Verify guest browsing, sign-in, like/unlike behavior, and retrieval on a second device/account session before release.

Because this is a new project, rollback can redeploy the previous frontend version; the likes table can remain unused without affecting it.

