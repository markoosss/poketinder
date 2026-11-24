# Tasks

## 1. Frontend and catalog

- [x] 1.1 Scaffold the React/Vite frontend and verify its production build completes.
- [ ] 1.2 Add the fixed catalog with at least 100 distinct Pokémon and appropriately licensed local images; document asset sources and verify automated checks enforce the 100-entry minimum, unique identifiers, and image availability.

## 2. Accounts and storage

- [ ] 2.1 Add a database migration for account-owned likes with a unique user/Pokémon pair and row-level security; document migration setup and verify users can access only their own rows.
- [ ] 2.2 Configure managed email authentication and frontend environment settings without exposing privileged keys; document setup and verify sign-up, sign-in, and sign-out flows.

## 3. Gallery and likes

- [ ] 3.1 Build the gallery cards and guest browsing experience; verify tests render the catalog and its Pokémon names and images without requiring sign-in.
- [ ] 3.2 Add the sign-in prompt and authenticated like/unlike actions; verify tests cover guest gating, saved state, and removal of a like.

## 4. Integration verification

- [ ] 4.1 Run the production build and end-to-end checks for at least 100 cards, likes across separate sessions/devices, and isolation between two user accounts; document the verification command and results.
