# Tasks

## 1. Frontend and catalog

- [x] 1.1 Scaffold the React/Vite frontend and verify its production build completes.
- [x] 1.2 Load at least 100 distinct Pokémon entries from PokeAPI at runtime, use its artwork URLs when available with a local generic placeholder fallback, document the sources, and test the entry count, uniqueness, and image fallback.

## 2. Accounts and storage

- [x] 2.1 Add a database migration for account-owned likes with a unique user/Pokémon pair and row-level security; document migration setup and verify users can access only their own rows.
- [x] 2.2 Configure managed email authentication and frontend environment settings without exposing privileged keys; document setup and verify sign-up, sign-in, and sign-out flows.

## 3. Gallery and likes

- [x] 3.1 Build the gallery cards and guest browsing experience; verify tests render at least 100 API-backed cards with names and placeholders without requiring sign-in.
- [x] 3.2 Allow session-only guest likes and optional authenticated like/unlike actions; merge guest likes on sign-in and verify saved state and removal.

## 4. Integration verification

- [x] 4.1 Run the production build and end-to-end checks for the API error/retry state, at least 100 cards, likes across separate sessions/devices, and isolation between two user accounts; document the verification command and results.
