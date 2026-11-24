import { getSupabaseClient } from './supabase.js'

function throwLikeError(error, action) {
  if (error) {
    const detail = error instanceof Error ? `: ${error.message}` : ''
    throw new Error(`No se pudieron ${action}${detail}`)
  }
}

export async function fetchPokemonLikes(userId) {
  const { data, error } = await getSupabaseClient()
    .from('pokemon_likes')
    .select('pokemon_id')
    .eq('user_id', userId)

  throwLikeError(error, 'cargar tus favoritos')

  if (!Array.isArray(data)) {
    throw new Error('La base de datos devolvió una lista de favoritos inválida.')
  }

  return data.map(({ pokemon_id: pokemonId }) => pokemonId)
}

export async function addPokemonLike(userId, pokemonId) {
  const { error } = await getSupabaseClient()
    .from('pokemon_likes')
    .insert({ user_id: userId, pokemon_id: pokemonId })

  throwLikeError(error, 'guardar este favorito')
}

export async function removePokemonLike(userId, pokemonId) {
  const { error } = await getSupabaseClient()
    .from('pokemon_likes')
    .delete()
    .eq('user_id', userId)
    .eq('pokemon_id', pokemonId)

  throwLikeError(error, 'quitar este favorito')
}
