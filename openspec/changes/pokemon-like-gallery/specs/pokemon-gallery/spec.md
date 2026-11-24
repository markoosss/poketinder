# Spec Delta

## Purpose

Provides a browsable Pokémon gallery where users can keep personal likes tied to their accounts and access them across devices.

## ADDED Requirements

### Requirement: Browse the fixed Pokémon gallery
The system SHALL display a predefined catalog of at least 100 distinct Pokémon as image cards without requiring authentication.

#### Scenario: Visitor opens the gallery
- **WHEN** a visitor opens the gallery
- **THEN** the system displays at least 100 Pokémon cards, each with its name and image

### Requirement: Sign in before liking a Pokémon
The system SHALL require an authenticated account before recording a Pokémon like.

#### Scenario: Visitor tries to like a Pokémon
- **GIVEN** the visitor is not signed in
- **WHEN** the visitor tries to like a Pokémon
- **THEN** the system prompts the visitor to sign in and does not record the like

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

### Requirement: Keep likes available across devices
The system SHALL persist each user's likes so they are available when that user signs in on another device.

#### Scenario: User signs in on another device
- **GIVEN** the user has recorded likes on one device
- **WHEN** the user signs in to the same account on another device
- **THEN** the gallery shows the user's previously recorded likes
