import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para ejecutar la prueba de autenticación.',
  )
}

if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(supabaseUrl).hostname)) {
  throw new Error('Las pruebas de integración solo se ejecutan contra Supabase local.')
}

test('email account can sign up, sign in, and sign out', async () => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
  const email = `auth-${randomUUID()}@example.test`
  const password = `Poketinder-${randomUUID()}-9A!`
  let userId

  try {
    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email,
      password,
    })

    assert.equal(signUpError, null, signUpError?.message)
    assert.ok(signUpData.user)
    assert.ok(signUpData.session, 'local email auth should return a session')
    userId = signUpData.user.id

    const { error: signOutError } = await client.auth.signOut()
    assert.equal(signOutError, null, signOutError?.message)

    const { data: signInData, error: signInError } =
      await client.auth.signInWithPassword({ email, password })

    assert.equal(signInError, null, signInError?.message)
    assert.equal(signInData.user.id, signUpData.user.id)

    const { error: finalSignOutError } = await client.auth.signOut()
    assert.equal(finalSignOutError, null, finalSignOutError?.message)

    const { data: sessionData, error: sessionError } =
      await client.auth.getSession()
    assert.equal(sessionError, null, sessionError?.message)
    assert.equal(sessionData.session, null)
  } finally {
    if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false,
          },
        },
      )
      const { error } = await admin.auth.admin.deleteUser(userId)
      assert.equal(error, null, error?.message)
    }
  }
})
