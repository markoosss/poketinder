# Proposal

## Why

The project needs a simple way to browse Pokémon and keep personal favorites. Account-backed likes let each user retain their choices across devices without requiring visitors to sign in just to explore.

## What Changes

- Load at least 100 Pokémon entries from PokeAPI when the gallery opens and display them as cards.
- Use a local generic placeholder image until appropriately licensed Pokémon artwork is available.
- Let visitors browse without an account; require sign-in when they try to like a Pokémon.
- Let signed-in users add or remove likes and retain their choices across devices.
- Use managed authentication and data storage to keep the account implementation small.

## Capabilities

### New Capabilities
- `pokemon-gallery`: Browse PokeAPI's Pokémon catalog and manage account-backed likes.

### Modified Capabilities
- None.

## Impact

The React/Vite frontend scaffold is in place. The change adds a runtime dependency on PokeAPI and a shared authentication/data service for user-specific likes; Pokémon artwork remains a generic local placeholder until licensed assets are available.
