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

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  })

  assert.equal(signUpError, null, signUpError?.message)
  assert.ok(signUpData.user)
  assert.ok(signUpData.session, 'local email auth should return a session')

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
})
