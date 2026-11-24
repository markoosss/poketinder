import { useEffect, useMemo, useState } from 'react'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '../lib/supabase.js'

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

export function useAuth() {
  const client = useMemo(
    () => (isSupabaseConfigured() ? getSupabaseClient() : null),
    [],
  )
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(client ? 'loading' : 'unconfigured')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!client) {
      return undefined
    }

    let active = true
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null)
        setStatus('ready')
        setError('')
      }
    })

    client.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (sessionError) {
          throw sessionError
        }

        if (active) {
          setUser(data.session?.user ?? null)
          setStatus('ready')
          setError('')
        }
      })
      .catch((sessionError) => {
        if (active) {
          setError(
            getErrorMessage(
              sessionError,
              'No se pudo comprobar la sesión de tu cuenta.',
            ),
          )
          setStatus('error')
        }
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  async function signIn(email, password) {
    if (!client) {
      throw new Error(
        'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar las cuentas.',
      )
    }

    const { error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      throw signInError
    }
  }

  async function signUp(email, password) {
    if (!client) {
      throw new Error(
        'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar las cuentas.',
      )
    }

    const { data, error: signUpError } = await client.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      throw signUpError
    }

    return data
  }

  async function signOut() {
    if (!client) {
      throw new Error(
        'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar las cuentas.',
      )
    }

    const { error: signOutError } = await client.auth.signOut()

    if (signOutError) {
      throw signOutError
    }
  }

  return {
    user,
    status,
    error,
    configured: Boolean(client),
    signIn,
    signUp,
    signOut,
  }
}
