-- Run this in Supabase → SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  wallet_address text not null,
  x_username text not null,
  referral text not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),

  constraint users_email_key unique (email),
  constraint users_wallet_address_key unique (wallet_address),
  constraint users_x_username_key unique (x_username),
  constraint users_referral_key unique (referral)
);

create index if not exists users_wallet_address_idx on public.users (wallet_address);
create index if not exists users_referral_idx on public.users (referral);

alter table public.users enable row level security;

-- No public policies: browser clients cannot read/write.
-- Your Express server uses the service role key (bypasses RLS).

create or replace function public.increment_referral_score(ref_code text)
returns setof public.users
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.users
  set score = score + 1
  where referral = ref_code
  returning *;
end;
$$;

revoke all on function public.increment_referral_score(text) from public;
grant execute on function public.increment_referral_score(text) to service_role;
