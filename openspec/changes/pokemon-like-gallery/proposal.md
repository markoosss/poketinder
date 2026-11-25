# Proposal

## Why

The project needs a simple way to browse Pokémon and keep personal favorites. Account-backed likes let each user retain their choices across devices without requiring visitors to sign in just to explore.

## What Changes

- Load at least 100 Pokémon entries from PokeAPI when the gallery opens and display them as cards.
- Use Pokémon artwork from PokeAPI when available and a local generic placeholder as a fallback.
- Let visitors browse and like Pokémon without an account; keep guest likes in memory for the current visit.
- Merge current-visit guest likes into the account when a visitor signs in; let signed-in users retain their choices across devices.
- Use managed authentication and data storage to keep the account implementation small.

## Capabilities

### New Capabilities
- `pokemon-gallery`: Browse PokeAPI's Pokémon catalog and manage account-backed likes.

### Modified Capabilities
- None.

## Impact

The React/Vite frontend scaffold is in place. The change adds a runtime dependency on PokeAPI and a shared authentication/data service for user-specific likes; each Pokémon card uses its PokeAPI artwork URL when available and falls back to the local placeholder.
