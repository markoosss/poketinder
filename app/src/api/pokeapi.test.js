import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import {
  fetchPokemonCatalog,
  POKEAPI_URL,
  POKEMON_PLACEHOLDER_URL,
} from './pokeapi.js'

function createResults(count = 100) {
  return Array.from({ length: count }, (_, index) => ({
    name: `pokemon-${index + 1}`,
    url: `https://pokeapi.co/api/v2/pokemon/${index + 1}/`,
  }))
}

function createResponse(results, ok = true) {
  return {
    ok,
    json: async () => ({ results }),
  }
}

function createDetailResponse(id, { officialArtwork = true, sprite = true } = {}) {
  return {
    ok: true,
    json: async () => ({
      sprites: {
        other: {
          'official-artwork': {
            front_default: officialArtwork
              ? `https://images.example.test/official/${id}.png`
              : null,
          },
        },
        front_default: sprite
          ? `https://images.example.test/sprite/${id}.png`
          : null,
      },
    }),
  }
}

function createCatalogFetcher(results = createResults()) {
  const requestedUrls = []

  return {
    requestedUrls,
    fetcher: async (url) => {
      requestedUrls.push(url)

      if (url === POKEAPI_URL) {
        return createResponse(results)
      }

      const id = Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1])
      return createDetailResponse(id)
    },
  }
}

test('loads 100 unique Pokémon and uses their PokeAPI official artwork', async () => {
  const { fetcher, requestedUrls } = createCatalogFetcher()
  const pokemon = await fetchPokemonCatalog(fetcher)

  assert.equal(requestedUrls[0], POKEAPI_URL)
  assert.equal(requestedUrls.length, 101)
  assert.equal(pokemon.length, 100)
  assert.equal(new Set(pokemon.map(({ id }) => id)).size, 100)
  assert.equal(new Set(pokemon.map(({ name }) => name)).size, 100)
  assert.ok(
    pokemon.every(({ id, imageUrl }) => {
      return imageUrl === `https://images.example.test/official/${id}.png`
    }),
  )
  assert.ok(
    existsSync(
      fileURLToPath(
        new URL('../../public/pokemon-placeholder.svg', import.meta.url),
      ),
    ),
  )
})

test('limits concurrent Pokémon detail requests to batches of 10', async () => {
  let activeRequests = 0
  let maxActiveRequests = 0
  const pokemon = await fetchPokemonCatalog(async (url) => {
    if (url === POKEAPI_URL) {
      return createResponse(createResults())
    }

    const id = Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1])
    activeRequests += 1
    maxActiveRequests = Math.max(maxActiveRequests, activeRequests)
    await Promise.resolve()
    activeRequests -= 1

    return createDetailResponse(id)
  })

  assert.equal(pokemon.length, 100)
  assert.equal(maxActiveRequests, 10)
})

test('falls back to the default sprite or local placeholder when artwork is absent', async () => {
  const { fetcher: catalogFetcher } = createCatalogFetcher()
  const pokemon = await fetchPokemonCatalog(async (url) => {
    if (url === POKEAPI_URL) {
      return createResponse(createResults(100))
    }

    const id = Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1])

    if (id === 1) {
      return createDetailResponse(id, { officialArtwork: false })
    }

    if (id === 2) {
      return createDetailResponse(id, {
        officialArtwork: false,
        sprite: false,
      })
    }

    return catalogFetcher(url)
  })

  assert.equal(pokemon[0].imageUrl, 'https://images.example.test/sprite/1.png')
  assert.equal(pokemon[1].imageUrl, POKEMON_PLACEHOLDER_URL)
})

test('rejects a catalog with fewer than 100 entries', async () => {
  await assert.rejects(
    fetchPokemonCatalog(async () => createResponse(createResults(99))),
    /al menos 100/,
  )
})

test('rejects duplicate Pokémon identifiers', async () => {
  const results = createResults()
  results[1].url = results[0].url

  await assert.rejects(
    fetchPokemonCatalog(async () => createResponse(results)),
    /duplicados/,
  )
})

test('reports an unsuccessful PokeAPI response', async () => {
  await assert.rejects(
    fetchPokemonCatalog(async () => createResponse([], false)),
    /No se pudo cargar/,
  )
})

test('reports an unsuccessful Pokémon detail response', async () => {
  await assert.rejects(
    fetchPokemonCatalog(async (url) => {
      if (url === POKEAPI_URL) {
        return createResponse(createResults())
      }

      const id = Number(url.match(/\/pokemon\/(\d+)\/?$/)?.[1])
      return { ...createDetailResponse(id), ok: id !== 1 }
    }),
    /No se pudieron cargar los datos de imagen de pokemon-1/,
  )
})
