import { useEffect, useState } from 'react'
import {
  fetchPokemonCatalog,
  POKEMON_PLACEHOLDER_URL,
} from './api/pokeapi.js'
import { useAuth } from './auth/useAuth.js'
import {
  addPokemonLike,
  fetchPokemonLikes,
  removePokemonLike,
} from './lib/pokemonLikes.js'
import './App.css'

const EMPTY_IDS = new Set()

function formatPokemonName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function PokemonGrid({
  pokemon,
  user,
  likedIds,
  pendingLikeIds,
  likesStatus,
  onToggleLike,
}) {
  return (
    <div className="pokemon-grid">
      {pokemon.map((entry) => {
        const name = formatPokemonName(entry.name)
        const isLiked = likedIds.has(entry.id)
        const isPending = pendingLikeIds.has(entry.id)

        return (
          <article className="pokemon-card" key={entry.id}>
            <div className="pokemon-card__art">
              <img
                alt={`Imagen de ${name}`}
                decoding="async"
                loading="lazy"
                onError={(event) => {
                  const image = event.currentTarget

                  if (!image.src.endsWith(POKEMON_PLACEHOLDER_URL)) {
                    image.src = POKEMON_PLACEHOLDER_URL
                  }
                }}
                src={entry.imageUrl}
              />
              <span className="pokemon-card__number">
                #{String(entry.id).padStart(3, '0')}
              </span>
            </div>
            <div className="pokemon-card__details">
              <div className="pokemon-card__title">
                <h3>{name}</h3>
                <span className="pokemon-card__type">Pokémon</span>
              </div>
              <button
                aria-label={`${isLiked ? 'Quitar like de' : 'Me gusta'} ${name}`}
                aria-pressed={isLiked}
                className={`favorite-button${isLiked ? ' favorite-button--active' : ''}`}
                disabled={
                  Boolean(user) &&
                  (likesStatus !== 'ready' || isPending)
                }
                onClick={() => onToggleLike(entry.id)}
                type="button"
              >
                <span aria-hidden="true">♥</span>
                {isPending
                  ? 'Guardando...'
                  : isLiked
                    ? 'En tus favoritos'
                    : 'Añadir a favoritos'}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function AuthDialog({
  configured,
  mode,
  email,
  password,
  feedback,
  feedbackType,
  busy,
  onClose,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <div
      className="auth-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }}
    >
      <section
        aria-labelledby="auth-dialog-title"
        aria-modal="true"
        className="auth-dialog"
        role="dialog"
      >
        <button
          aria-label="Cerrar ventana de cuenta"
          className="auth-dialog__close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
        <p className="eyebrow">Tus favoritos te esperan</p>
        <h2 id="auth-dialog-title">
          {mode === 'sign-in'
            ? 'Inicia sesión para guardar tus favoritos'
            : 'Crea tu cuenta'}
        </h2>
        <p className="auth-dialog__description">
          Guarda tus Pokémon favoritos y accede a ellos desde cualquier
          dispositivo.
        </p>

        {!configured ? (
          <p className="auth-feedback auth-feedback--error" role="alert">
            Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar
            las cuentas.
          </p>
        ) : (
          <>
            <form className="auth-form" onSubmit={onSubmit}>
              <label htmlFor="auth-email">Correo electrónico</label>
              <input
                autoComplete="email"
                autoFocus
                id="auth-email"
                onChange={onEmailChange}
                required
                type="email"
                value={email}
              />
              <label htmlFor="auth-password">Contraseña</label>
              <input
                autoComplete={
                  mode === 'sign-up' ? 'new-password' : 'current-password'
                }
                id="auth-password"
                minLength={8}
                onChange={onPasswordChange}
                required
                type="password"
                value={password}
              />
              {feedback && (
                <p
                  className={`auth-feedback${feedbackType === 'error' ? ' auth-feedback--error' : ''}`}
                  role={feedbackType === 'error' ? 'alert' : 'status'}
                >
                  {feedback}
                </p>
              )}
              <button className="auth-submit" disabled={busy} type="submit">
                {busy
                  ? 'Un momento...'
                  : mode === 'sign-in'
                    ? 'Iniciar sesión'
                    : 'Crear cuenta'}
              </button>
            </form>
            <p className="auth-dialog__switch">
              {mode === 'sign-in' ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                onClick={() =>
                  onModeChange(mode === 'sign-in' ? 'sign-up' : 'sign-in')
                }
                type="button"
              >
                {mode === 'sign-in' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
          </>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const [catalog, setCatalog] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [likeData, setLikeData] = useState({
    userId: null,
    attempt: 0,
    status: 'idle',
    ids: EMPTY_IDS,
    error: '',
  })
  const [pendingLikeIds, setPendingLikeIds] = useState(() => new Set())
  const [likesRetry, setLikesRetry] = useState(0)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authMode, setAuthMode] = useState('sign-in')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authFeedback, setAuthFeedback] = useState('')
  const [authFeedbackType, setAuthFeedbackType] = useState('status')
  const [authBusy, setAuthBusy] = useState(false)
  const [signOutError, setSignOutError] = useState('')
  const [signOutBusy, setSignOutBusy] = useState(false)
  const { user, error: authError, configured, signIn, signUp, signOut } = useAuth()
  const userId = user?.id
  const hasCurrentLikeData =
    Boolean(userId) &&
    likeData.userId === userId &&
    likeData.attempt === likesRetry
  const likedIds = hasCurrentLikeData ? likeData.ids : EMPTY_IDS
  const likesStatus = !userId
    ? 'idle'
    : hasCurrentLikeData
      ? likeData.status
      : 'loading'
  const likesError = hasCurrentLikeData ? likeData.error : ''

  useEffect(() => {
    let active = true

    fetchPokemonCatalog()
      .then((pokemon) => {
        if (active) {
          setCatalog(pokemon)
          setStatus('ready')
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se pudo cargar el catálogo de Pokémon.',
          )
          setStatus('error')
        }
      })

    return () => {
      active = false
    }
  }, [attempt])

  useEffect(() => {
    let active = true

    if (!userId) {
      return undefined
    }

    fetchPokemonLikes(userId)
      .then((pokemonIds) => {
        if (active) {
          setLikeData({
            userId,
            attempt: likesRetry,
            status: 'ready',
            ids: new Set(pokemonIds),
            error: '',
          })
        }
      })
      .catch((error) => {
        if (active) {
          setLikeData({
            userId,
            attempt: likesRetry,
            status: 'error',
            ids: EMPTY_IDS,
            error:
              error instanceof Error
                ? error.message
                : 'No se pudieron cargar tus favoritos.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [userId, likesRetry])

  function retryCatalog() {
    setErrorMessage('')
    setStatus('loading')
    setAttempt((currentAttempt) => currentAttempt + 1)
  }

  function openAuthDialog() {
    setAuthMode('sign-in')
    setAuthFeedback('')
    setAuthDialogOpen(true)
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthFeedback('')

    try {
      if (authMode === 'sign-up') {
        const data = await signUp(authEmail, authPassword)

        if (!data.session) {
          setAuthFeedback(
            'Cuenta creada. Revisa tu correo para confirmar el registro.',
          )
          setAuthFeedbackType('status')
          return
        }
      } else {
        await signIn(authEmail, authPassword)
      }

      setAuthDialogOpen(false)
      setAuthEmail('')
      setAuthPassword('')
    } catch (error) {
      setAuthFeedback(
        error instanceof Error ? error.message : 'No se pudo completar el acceso.',
      )
      setAuthFeedbackType('error')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    setSignOutBusy(true)
    setSignOutError('')

    try {
      await signOut()
    } catch (error) {
      setSignOutError(
        error instanceof Error ? error.message : 'No se pudo cerrar la sesión.',
      )
    } finally {
      setSignOutBusy(false)
    }
  }

  async function toggleLike(pokemonId) {
    if (!user) {
      openAuthDialog()
      return
    }

    if (likesStatus !== 'ready' || pendingLikeIds.has(pokemonId)) {
      return
    }

    const activeUserId = user.id
    const shouldRemove = likedIds.has(pokemonId)
    setPendingLikeIds((currentIds) => new Set(currentIds).add(pokemonId))

    try {
      if (shouldRemove) {
        await removePokemonLike(user.id, pokemonId)
      } else {
        await addPokemonLike(user.id, pokemonId)
      }

      setLikeData((currentData) => {
        if (
          currentData.userId !== activeUserId ||
          currentData.attempt !== likesRetry
        ) {
          return currentData
        }

        const nextIds = new Set(currentData.ids)

        if (shouldRemove) {
          nextIds.delete(pokemonId)
        } else {
          nextIds.add(pokemonId)
        }

        return { ...currentData, ids: nextIds, error: '' }
      })
    } catch (error) {
      setLikeData((currentData) =>
        currentData.userId === activeUserId &&
        currentData.attempt === likesRetry
          ? {
              ...currentData,
              error:
                error instanceof Error
                  ? error.message
                  : 'No se pudo guardar el favorito.',
            }
          : currentData,
      )
    } finally {
      setPendingLikeIds((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(pokemonId)
        return nextIds
      })
    }
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Poketinder, inicio">
          <span className="brand__mark" aria-hidden="true">
            P
          </span>
          <span>Poketinder</span>
        </a>
        <div className="header-account">
          {user ? (
            <>
              <span className="account-email" title={user.email || undefined}>
                {user.email}
              </span>
              <button
                className="sign-out-button"
                disabled={signOutBusy}
                onClick={handleSignOut}
                type="button"
              >
                {signOutBusy ? 'Cerrando...' : 'Cerrar sesión'}
              </button>
            </>
          ) : (
            <>
              <span className="guest-label">
                <span className="guest-label__dot" aria-hidden="true" />
                Exploración libre
              </span>
              <button
                className="header-auth-button"
                onClick={openAuthDialog}
                type="button"
              >
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </header>

      {(authError || signOutError) && (
        <p className="account-error" role="alert">
          {signOutError || authError}
        </p>
      )}

      <section className="hero" aria-labelledby="page-title">
        <div className="hero__content">
          <p className="eyebrow">Tu próxima aventura empieza aquí</p>
          <h1 id="page-title">
            Encuentra tu
            <br />
            <span>Pokémon favorito.</span>
          </h1>
          <p className="hero__description">
            Explora los primeros 100 Pokémon y descubre cuáles se ganan un
            lugar en tu equipo.
          </p>
          <div className="hero__note">
            <span aria-hidden="true">✦</span>
            Puedes explorar la galería sin iniciar sesión.
          </div>
        </div>
        <div className="hero__decoration" aria-hidden="true">
          <div className="orbit orbit--outer" />
          <div className="orbit orbit--inner" />
          <div className="hero-ball">
            <div className="hero-ball__top" />
            <div className="hero-ball__middle">
              <span />
            </div>
            <div className="hero-ball__bottom" />
          </div>
          <span className="sparkle sparkle--one">✦</span>
          <span className="sparkle sparkle--two">✧</span>
          <span className="sparkle sparkle--three">✦</span>
        </div>
      </section>

      <section className="catalog-section" aria-labelledby="catalog-title">
        <div className="catalog-heading">
          <div>
            <p className="eyebrow">La colección</p>
            <h2 id="catalog-title">Pokémon para descubrir</h2>
          </div>
          <p className="catalog-heading__source">
            Datos en vivo desde PokeAPI
          </p>
        </div>

        {status === 'loading' && (
          <div className="catalog-message" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Cargando la colección Pokémon...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="catalog-message catalog-message--error" role="alert">
            <span className="catalog-message__icon" aria-hidden="true">
              !
            </span>
            <h3>No pudimos cargar la colección</h3>
            <p>{errorMessage}</p>
            <button className="retry-button" onClick={retryCatalog} type="button">
              Reintentar
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="catalog-summary">
              <span>{catalog.length} Pokémon</span>
              <span className="catalog-summary__divider" aria-hidden="true" />
              <span>Generación original</span>
            </div>
            {likesError && (
              <div className="likes-alert" role="alert">
                <span>{likesError}</span>
                {likesStatus === 'error' && (
                  <button
                    onClick={() => setLikesRetry((retry) => retry + 1)}
                    type="button"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            )}
            <PokemonGrid
              likedIds={likedIds}
              likesStatus={likesStatus}
              onToggleLike={toggleLike}
              pendingLikeIds={pendingLikeIds}
              pokemon={catalog}
              user={user}
            />
          </>
        )}
      </section>

      <footer className="site-footer">
        <span>Poketinder</span>
        <span>Una colección para encontrar a tus favoritos.</span>
      </footer>

      {authDialogOpen && (
        <AuthDialog
          busy={authBusy}
          configured={configured}
          email={authEmail}
          feedback={authFeedback}
          feedbackType={authFeedbackType}
          mode={authMode}
          onClose={() => setAuthDialogOpen(false)}
          onEmailChange={(event) => setAuthEmail(event.target.value)}
          onModeChange={(mode) => {
            setAuthMode(mode)
            setAuthFeedback('')
          }}
          onPasswordChange={(event) => setAuthPassword(event.target.value)}
          onSubmit={submitAuth}
          password={authPassword}
        />
      )}
    </main>
  )
}
