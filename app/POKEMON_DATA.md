# Pokémon data and artwork

The gallery loads the first 100 Pokémon from [PokeAPI](https://pokeapi.co/api/v2/pokemon?limit=100), then reads each Pokémon's detail resource for its image URL. It prefers `sprites.other.official-artwork.front_default`, falls back to `sprites.front_default`, and uses the locally authored `public/pokemon-placeholder.svg` when neither is available.

Detail requests are made in batches of 10. Images load lazily in the browser, and a failed image request falls back to the local placeholder. The project owner confirms authorization to display these sprites.
