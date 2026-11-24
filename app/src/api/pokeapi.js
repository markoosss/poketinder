export const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon?limit=100'
export const POKEMON_PLACEHOLDER_URL = '/pokemon-placeholder.svg'

export async function fetchPokemonCatalog(fetcher = fetch) {
  const response = await fetcher(POKEAPI_URL)

  if (!response.ok) {
    throw new Error('No se pudo cargar el catálogo de PokeAPI.')
  }

  const payload = await response.json()

  if (!Array.isArray(payload?.results) || payload.results.length < 100) {
    throw new Error('PokeAPI no devolvió al menos 100 Pokémon.')
  }

  const pokemon = payload.results.slice(0, 100).map((entry) => {
    const idMatch =
      typeof entry?.url === 'string' &&
      entry.url.match(/\/pokemon\/(\d+)\/?$/)

    if (typeof entry?.name !== 'string' || !entry.name || !idMatch) {
      throw new Error('PokeAPI devolvió una entrada de Pokémon inválida.')
    }

    return {
      id: Number(idMatch[1]),
      name: entry.name,
      imageUrl: POKEMON_PLACEHOLDER_URL,
    }
  })

  const uniqueIds = new Set(pokemon.map(({ id }) => id))
  const uniqueNames = new Set(pokemon.map(({ name }) => name.toLowerCase()))

  if (uniqueIds.size !== pokemon.length || uniqueNames.size !== pokemon.length) {
    throw new Error('PokeAPI devolvió Pokémon duplicados.')
  }

  return pokemon
}
