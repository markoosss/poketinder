// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { fetchPokemonCatalog } from './api/pokeapi.js'
import { useAuth } from './auth/useAuth.js'
import {
  addPokemonLike,
  fetchPokemonLikes,
  removePokemonLike,
} from './lib/pokemonLikes.js'

vi.mock('./api/pokeapi.js', () => ({
  fetchPokemonCatalog: vi.fn(),
}))

vi.mock('./auth/useAuth.js', () => ({
  useAuth: vi.fn(),
}))

vi.mock('./lib/pokemonLikes.js', () => ({
  addPokemonLike: vi.fn(),
  fetchPokemonLikes: vi.fn(),
  removePokemonLike: vi.fn(),
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
  fetchPokemonLikes.mockReset().mockResolvedValue([])
  addPokemonLike.mockReset().mockResolvedValue(undefined)
  removePokemonLike.mockReset().mockResolvedValue(undefined)
  useAuth.mockReturnValue({
    user: null,
    error: '',
    configured: true,
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue({ session: { user: { id: 'user-1' } } }),
    signOut: vi.fn().mockResolvedValue(undefined),
  })
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

  it('prompts visitors to sign in without saving a like', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Me gusta Bulbasaur' }))

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(
      screen.getByRole('heading', {
        name: 'Inicia sesión para guardar tus favoritos',
      }),
    ).toBeTruthy()
    expect(addPokemonLike).not.toHaveBeenCalled()
    expect(fetchPokemonLikes).not.toHaveBeenCalled()
  })

  it('loads saved likes and persists adding and removing favorites', async () => {
    useAuth.mockReturnValue({
      user: { id: 'user-1', email: 'trainer@example.test' },
      error: '',
      configured: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    fetchPokemonLikes.mockResolvedValue([1])

    render(<App />)

    const savedBulbasaur = await screen.findByRole('button', {
      name: 'Quitar like de Bulbasaur',
    })
    expect(savedBulbasaur.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Me gusta Pokemon 2' }))
    await waitFor(() => {
      expect(addPokemonLike).toHaveBeenCalledWith('user-1', 2)
    })
    expect(
      (await screen.findByRole('button', { name: 'Quitar like de Pokemon 2' }))
        .getAttribute('aria-pressed'),
    ).toBe('true')

    fireEvent.click(savedBulbasaur)
    await waitFor(() => {
      expect(removePokemonLike).toHaveBeenCalledWith('user-1', 1)
    })
    expect(
      (await screen.findByRole('button', { name: 'Me gusta Bulbasaur' }))
        .getAttribute('aria-pressed'),
    ).toBe('false')
  })

  it('submits sign-in credentials through the account client', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined)
    useAuth.mockReturnValue({
      user: null,
      error: '',
      configured: true,
      signIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }))
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'trainer@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secret-password' },
    })
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Iniciar sesión',
      }),
    )

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith(
        'trainer@example.test',
        'secret-password',
      )
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('lets visitors create an account from the like prompt', async () => {
    const signUp = vi
      .fn()
      .mockResolvedValue({ session: { user: { id: 'user-1' } } })
    useAuth.mockReturnValue({
      user: null,
      error: '',
      configured: true,
      signIn: vi.fn(),
      signUp,
      signOut: vi.fn(),
    })
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Me gusta Bulbasaur' }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'new-trainer@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'new-secret-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith(
        'new-trainer@example.test',
        'new-secret-password',
      )
    })
    expect(screen.queryByRole('dialog')).toBeNull()
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
