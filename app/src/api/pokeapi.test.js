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

test('loads 100 unique Pokémon and uses the local placeholder', async () => {
  let requestedUrl
  const pokemon = await fetchPokemonCatalog(async (url) => {
    requestedUrl = url
    return createResponse(createResults())
  })

  assert.equal(requestedUrl, POKEAPI_URL)
  assert.equal(pokemon.length, 100)
  assert.equal(new Set(pokemon.map(({ id }) => id)).size, 100)
  assert.equal(new Set(pokemon.map(({ name }) => name)).size, 100)
  assert.ok(pokemon.every(({ imageUrl }) => imageUrl === POKEMON_PLACEHOLDER_URL))
  assert.ok(
    existsSync(
      fileURLToPath(
        new URL('../../public/pokemon-placeholder.svg', import.meta.url),
      ),
    ),
  )
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
