# Spec Delta

## Purpose

Provides a browsable Pokémon gallery where users can keep personal likes tied to their accounts and access them across devices.

## ADDED Requirements

### Requirement: Browse the PokeAPI Pokémon gallery
The system SHALL load at least 100 distinct Pokémon entries from PokeAPI when the gallery opens and display them as image cards without requiring authentication. Each card SHALL use licensed artwork when configured, or a local generic placeholder otherwise.

#### Scenario: PokeAPI returns the catalog
- **WHEN** a visitor opens the gallery and PokeAPI returns the requested entries
- **THEN** the system displays at least 100 cards with Pokémon names and an image or the local generic placeholder

### Requirement: Report catalog loading failures
The system SHALL report when it cannot load the Pokémon catalog and provide a way to retry.

#### Scenario: PokeAPI is unavailable
- **WHEN** the gallery cannot retrieve the catalog from PokeAPI
- **THEN** the system displays a clear error and a retry action instead of presenting the catalog as successfully loaded

### Requirement: Allow guest likes
The system SHALL let visitors like and unlike Pokémon without authentication. Guest likes SHALL remain in memory for the current visit and SHALL NOT be persisted after the page is reloaded.

#### Scenario: Visitor likes a Pokémon
- **GIVEN** the visitor is not signed in
- **WHEN** the visitor selects the like action
- **THEN** the system records the like for the current visit without prompting for authentication

#### Scenario: Visitor reloads the gallery
- **GIVEN** the visitor has liked Pokémon without signing in
- **WHEN** the visitor reloads the page
- **THEN** the guest likes are cleared

### Requirement: Manage account-specific likes
The system SHALL let a signed-in user like or unlike a Pokémon, with each choice associated with that user's account.

#### Scenario: User likes a Pokémon
- **GIVEN** the user is signed in and has not liked the Pokémon
- **WHEN** the user selects the like action
- **THEN** the system records the like for that user's account

#### Scenario: User removes a like
- **GIVEN** the user is signed in and has liked the Pokémon
- **WHEN** the user selects the unlike action
- **THEN** the system removes the like from that user's account

#### Scenario: Visitor signs in after liking Pokémon
- **GIVEN** the visitor has guest likes in the current visit
- **WHEN** the visitor signs in
- **THEN** the system merges those likes into the signed-in user's account

### Requirement: Keep likes available across devices
The system SHALL persist each user's likes so they are available when that user signs in on another device.

#### Scenario: User signs in on another device
- **GIVEN** the user has recorded likes on one device
- **WHEN** the user signs in to the same account on another device
- **THEN** the gallery shows the user's previously recorded likes
