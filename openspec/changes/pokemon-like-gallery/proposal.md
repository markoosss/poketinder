# Proposal

## Why

The project needs a simple way to browse Pokémon artwork and keep personal favorites. Account-backed likes let each user retain their choices across devices without requiring visitors to sign in just to explore.

## What Changes

- Add a gallery with image cards for at least 100 Pokémon from a predefined catalog.
- Let visitors browse without an account; require sign-in when they try to like a Pokémon.
- Let signed-in users add or remove likes and retain their choices across devices.
- Prefer a managed authentication and data service to keep the account implementation small; select the provider during design.

## Capabilities

### New Capabilities
- `pokemon-gallery`: Browse a fixed Pokémon catalog and manage account-backed likes.

### Modified Capabilities
- None.

## Impact

This introduces a web frontend, a fixed Pokémon catalog with image assets, and a shared authentication/data service for user-specific likes. No existing code or capabilities are present.
