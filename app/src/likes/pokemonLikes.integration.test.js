import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error(
    'Define VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY para ejecutar la prueba de integración.',
  )
}

if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(supabaseUrl).hostname)) {
  throw new Error('Las pruebas de integración solo se ejecutan contra Supabase local.')
}

function createClientForUser() {
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })
}

async function createAccount(createdUserIds) {
  const client = createClientForUser()
  const email = `likes-${randomUUID()}@example.test`
  const password = `Poketinder-${randomUUID()}-9A!`
  const { data, error } = await client.auth.signUp({ email, password })

  assert.equal(error, null, error?.message)
  assert.ok(data.user)
  createdUserIds.push(data.user.id)
  assert.ok(data.session, 'local email auth should return a session')

  return { client, email, password, userId: data.user.id }
}

test('likes persist across sessions and remain isolated between accounts', async () => {
  const createdUserIds = []
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  })

  try {
    const trainer = await createAccount(createdUserIds)
    const trainerSecondSession = createClientForUser()
    const { data: secondSession, error: secondSessionError } =
      await trainerSecondSession.auth.signInWithPassword({
        email: trainer.email,
        password: trainer.password,
      })

    assert.equal(secondSessionError, null, secondSessionError?.message)
    assert.equal(secondSession.user.id, trainer.userId)

    const otherTrainer = await createAccount(createdUserIds)
    const { error: saveError } = await trainer.client
      .from('pokemon_likes')
      .insert({ user_id: trainer.userId, pokemon_id: 25 })

    assert.equal(saveError, null, saveError?.message)

    const { data: savedInSecondSession, error: readError } =
      await trainerSecondSession
        .from('pokemon_likes')
        .select('pokemon_id')
        .eq('pokemon_id', 25)

    assert.equal(readError, null, readError?.message)
    assert.deepEqual(
      savedInSecondSession.map(({ pokemon_id: pokemonId }) => pokemonId),
      [25],
    )

    const { data: otherTrainerLikes, error: isolationReadError } =
      await otherTrainer.client
        .from('pokemon_likes')
        .select('pokemon_id')
        .eq('user_id', trainer.userId)

    assert.equal(isolationReadError, null, isolationReadError?.message)
    assert.deepEqual(otherTrainerLikes, [])

    const { error: foreignInsertError } = await otherTrainer.client
      .from('pokemon_likes')
      .insert({ user_id: trainer.userId, pokemon_id: 26 })

    assert.equal(foreignInsertError?.code, '42501')

    const { data: foreignDeleteData, error: foreignDeleteError } =
      await otherTrainer.client
        .from('pokemon_likes')
        .delete()
        .eq('user_id', trainer.userId)
        .eq('pokemon_id', 25)
        .select('pokemon_id')

    assert.equal(foreignDeleteError, null, foreignDeleteError?.message)
    assert.deepEqual(foreignDeleteData, [])

    const { data: stillSaved, error: stillSavedError } = await trainer.client
      .from('pokemon_likes')
      .select('pokemon_id')
      .eq('pokemon_id', 25)

    assert.equal(stillSavedError, null, stillSavedError?.message)
    assert.equal(stillSaved.length, 1)

    const { error: removeError } = await trainerSecondSession
      .from('pokemon_likes')
      .delete()
      .eq('user_id', trainer.userId)
      .eq('pokemon_id', 25)

    assert.equal(removeError, null, removeError?.message)

    const { data: removedLike, error: removedLikeError } = await trainer.client
      .from('pokemon_likes')
      .select('pokemon_id')
      .eq('pokemon_id', 25)

    assert.equal(removedLikeError, null, removedLikeError?.message)
    assert.deepEqual(removedLike, [])
  } finally {
    for (const userId of createdUserIds) {
      const { error } = await admin.auth.admin.deleteUser(userId)
      assert.equal(error, null, error?.message)
    }
  }
})
