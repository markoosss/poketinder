export const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon?limit=100'
export const POKEMON_PLACEHOLDER_URL = '/pokemon-placeholder.svg'
const DETAIL_BATCH_SIZE = 10

function getPokemonImageUrl(details) {
  const officialArtwork =
    details?.sprites?.other?.['official-artwork']?.front_default
  const defaultSprite = details?.sprites?.front_default

  if (typeof officialArtwork === 'string' && officialArtwork) {
    return officialArtwork
  }

  if (typeof defaultSprite === 'string' && defaultSprite) {
    return defaultSprite
  }

  return POKEMON_PLACEHOLDER_URL
}

export async function fetchPokemonCatalog(fetcher = fetch) {
  const response = await fetcher(POKEAPI_URL)

  if (!response.ok) {
    throw new Error('No se pudo cargar el catálogo de PokeAPI.')
  }

  const payload = await response.json()

  if (!Array.isArray(payload?.results) || payload.results.length < 100) {
    throw new Error('PokeAPI no devolvió al menos 100 Pokémon.')
  }

  const catalog = payload.results.slice(0, 100).map((entry) => {
    const idMatch =
      typeof entry?.url === 'string' &&
      entry.url.match(/\/pokemon\/(\d+)\/?$/)

    if (typeof entry?.name !== 'string' || !entry.name || !idMatch) {
      throw new Error('PokeAPI devolvió una entrada de Pokémon inválida.')
    }

    return {
      id: Number(idMatch[1]),
      name: entry.name,
      url: entry.url,
    }
  })

  const uniqueIds = new Set(catalog.map(({ id }) => id))
  const uniqueNames = new Set(catalog.map(({ name }) => name.toLowerCase()))

  if (
    uniqueIds.size !== catalog.length ||
    uniqueNames.size !== catalog.length
  ) {
    throw new Error('PokeAPI devolvió Pokémon duplicados.')
  }

  const pokemon = []

  for (let offset = 0; offset < catalog.length; offset += DETAIL_BATCH_SIZE) {
    const batch = catalog.slice(offset, offset + DETAIL_BATCH_SIZE)
    const detailedPokemon = await Promise.all(
      batch.map(async ({ url, ...entry }) => {
        const detailResponse = await fetcher(url)

        if (!detailResponse.ok) {
          throw new Error(
            `No se pudieron cargar los datos de imagen de ${entry.name} desde PokeAPI.`,
          )
        }

        const details = await detailResponse.json()

        return {
          ...entry,
          imageUrl: getPokemonImageUrl(details),
        }
      }),
    )

    pokemon.push(...detailedPokemon)
  }

  return pokemon
}
