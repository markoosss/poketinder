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
  mergePokemonLikes,
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
  mergePokemonLikes: vi.fn(),
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
  mergePokemonLikes.mockReset().mockResolvedValue(undefined)
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
    expect(
      screen.getByText(
        'Explora y da likes sin cuenta; se guardan solo en esta visita.',
      ),
    ).toBeTruthy()
    expect(screen.getAllByRole('img')).toHaveLength(100)
  })

  it('shows a loading state while the catalog is being fetched', () => {
    fetchPokemonCatalog.mockReturnValue(new Promise(() => {}))
    render(<App />)

    expect(screen.getByRole('status').textContent).toContain(
      'Cargando la colección Pokémon...',
    )
  })

  it('lets visitors add and remove temporary likes without signing in', async () => {
    const { unmount } = render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Me gusta Bulbasaur' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(
      (
        await screen.findByRole('button', {
          name: 'Quitar like de Bulbasaur',
        })
      ).getAttribute('aria-pressed'),
    ).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Quitar like de Bulbasaur' }))

    expect(
      (await screen.findByRole('button', { name: 'Me gusta Bulbasaur' })).getAttribute(
        'aria-pressed',
      ),
    ).toBe('false')
    expect(addPokemonLike).not.toHaveBeenCalled()
    expect(mergePokemonLikes).not.toHaveBeenCalled()
    expect(fetchPokemonLikes).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Me gusta Bulbasaur' }))
    unmount()
    render(<App />)

    expect(
      (await screen.findByRole('button', { name: 'Me gusta Bulbasaur' })).getAttribute(
        'aria-pressed',
      ),
    ).toBe('false')
  })

  it('merges current guest likes into the account when the visitor signs in', async () => {
    const authState = {
      user: null,
      error: '',
      configured: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    }
    useAuth.mockImplementation(() => authState)
    let accountIds = [3]
    fetchPokemonLikes.mockImplementation(async () => accountIds)
    mergePokemonLikes.mockImplementation(async (_userId, pokemonIds) => {
      accountIds = [...new Set([...accountIds, ...pokemonIds])]
    })
    const { rerender } = render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Me gusta Bulbasaur' }))
    fireEvent.click(screen.getByRole('button', { name: 'Me gusta Pokemon 2' }))

    authState.user = { id: 'user-1', email: 'trainer@example.test' }
    rerender(<App />)

    await waitFor(() => {
      expect(mergePokemonLikes).toHaveBeenCalledWith('user-1', [1, 2])
    })
    expect(fetchPokemonLikes).toHaveBeenCalledWith('user-1')
    expect(
      (await screen.findByRole('button', { name: 'Quitar like de Bulbasaur' }))
        .getAttribute('aria-pressed'),
    ).toBe('true')
    expect(
      screen.getByRole('button', { name: 'Quitar like de Pokemon 2' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true')
    expect(
      screen.getByRole('button', { name: 'Quitar like de Pokemon 3' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true')
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

  it('lets visitors create an account optionally from the header', async () => {
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

    fireEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Crear cuenta',
      }),
    )

    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'new-trainer@example.test' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'new-secret-password' },
    })
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Crear cuenta',
      }),
    )

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
