import { useEffect, useState } from 'react'
import { fetchPokemonCatalog } from './api/pokeapi.js'
import './App.css'

function formatPokemonName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function PokemonGrid({ pokemon }) {
  return (
    <div className="pokemon-grid">
      {pokemon.map((entry) => {
        const name = formatPokemonName(entry.name)

        return (
          <article className="pokemon-card" key={entry.id}>
            <div className="pokemon-card__art">
              <img src={entry.imageUrl} alt={`Ilustración provisional de ${name}`} />
              <span className="pokemon-card__number">
                #{String(entry.id).padStart(3, '0')}
              </span>
            </div>
            <div className="pokemon-card__details">
              <h3>{name}</h3>
              <span className="pokemon-card__type">Pokémon</span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function App() {
  const [catalog, setCatalog] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

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

  function retryCatalog() {
    setErrorMessage('')
    setStatus('loading')
    setAttempt((currentAttempt) => currentAttempt + 1)
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
        <span className="guest-label">
          <span className="guest-label__dot" aria-hidden="true" />
          Exploración libre
        </span>
      </header>

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
            <PokemonGrid pokemon={catalog} />
          </>
        )}
      </section>

      <footer className="site-footer">
        <span>Poketinder</span>
        <span>Una colección para encontrar a tus favoritos.</span>
      </footer>
    </main>
  )
}
