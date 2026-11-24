// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { fetchPokemonCatalog } from './api/pokeapi.js'

vi.mock('./api/pokeapi.js', () => ({
  fetchPokemonCatalog: vi.fn(),
}))

function createCatalog() {
  return Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: index === 0 ? 'bulbasaur' : `pokemon-${index + 1}`,
    imageUrl: '/pokemon-placeholder.svg',
  }))
}

beforeEach(() => {
  fetchPokemonCatalog.mockReset()
  fetchPokemonCatalog.mockResolvedValue(createCatalog())
})

afterEach(() => {
  cleanup()
})

describe('Pokémon gallery', () => {
  it('renders all 100 cards for visitors without authentication', async () => {
    render(<App />)

    const cards = await screen.findAllByRole('article')

    expect(cards).toHaveLength(100)
    expect(screen.getByRole('heading', { name: 'Bulbasaur' })).toBeTruthy()
    expect(screen.getByText('Puedes explorar la galería sin iniciar sesión.')).toBeTruthy()
    expect(screen.getAllByRole('img')).toHaveLength(100)
  })

  it('shows a loading state while the catalog is being fetched', () => {
    fetchPokemonCatalog.mockReturnValue(new Promise(() => {}))
    render(<App />)

    expect(screen.getByRole('status').textContent).toContain(
      'Cargando la colección Pokémon...',
    )
  })

  it('shows the request error and lets visitors retry', async () => {
    fetchPokemonCatalog
      .mockRejectedValueOnce(new Error('PokeAPI no disponible'))
      .mockResolvedValueOnce(createCatalog())

    render(<App />)

    expect((await screen.findByRole('alert')).textContent).toContain(
      'PokeAPI no disponible',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findAllByRole('article')).toHaveLength(100)
    expect(fetchPokemonCatalog).toHaveBeenCalledTimes(2)
  })
})
