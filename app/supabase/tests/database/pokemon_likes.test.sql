begin;

select plan(7);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'likes-a@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'likes-b@example.test');

insert into public.pokemon_likes (user_id, pokemon_id)
values
  ('00000000-0000-0000-0000-000000000001', 1),
  ('00000000-0000-0000-0000-000000000002', 2);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

select is(
  (select count(*)::integer from public.pokemon_likes),
  1,
  'a user sees only their own likes'
);

select is(
  (select count(*)::integer from public.pokemon_likes
   where user_id = '00000000-0000-0000-0000-000000000002'),
  0,
  'a user cannot read another account''s likes'
);

select lives_ok(
  $$insert into public.pokemon_likes (user_id, pokemon_id)
    values ('00000000-0000-0000-0000-000000000001', 3)$$,
  'a user can create their own like'
);

select throws_ok(
  $$insert into public.pokemon_likes (user_id, pokemon_id)
    values ('00000000-0000-0000-0000-000000000002', 4)$$,
  '42501',
  'new row violates row-level security policy for table "pokemon_likes"',
  'a user cannot create a like for another account'
);

select lives_ok(
  $$delete from public.pokemon_likes
    where user_id = '00000000-0000-0000-0000-000000000002'$$,
  'deleting another account''s like does not raise an error'
);

reset role;

select is(
  (select count(*)::integer from public.pokemon_likes
   where user_id = '00000000-0000-0000-0000-000000000002'),
  1,
  'a user cannot delete another account''s like'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

select throws_ok(
  $$insert into public.pokemon_likes (user_id, pokemon_id)
    values ('00000000-0000-0000-0000-000000000001', 1)$$,
  '23505',
  null,
  'the same account cannot like one Pokémon twice'
);

select * from finish();
rollback;
