-- =============================================================================
-- Blink — initial schema
-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_cron;    -- scheduled matchmaking + phase advancement

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

-- Public-ish dating profile. One row per auth user, created automatically by
-- the handle_new_user trigger below.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default 'New player',
  age         int check (age is null or (age >= 18 and age <= 100)),
  looking_for text,
  location    text,
  photo_url   text,
  interests   text[] not null default '{}',
  prompts     jsonb  not null default '[]', -- [{ "q": "...", "a": "..." }]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Public dating-profile info. Readable by any signed-in user, matching how the product already treats round-1 info as visible.';

-- The gated "reveal round" info. Split into its own table specifically so a
-- Row Level Security policy can withhold it until a shared room reaches the
-- reveal phase — this is enforced by Postgres, not just hidden in the UI.
create table public.profile_reveal (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  profession text,
  education  text,
  lifestyle  text[] not null default '{}'
);

comment on table public.profile_reveal is
  'Gated profile info. RLS only allows reading another person''s row here once a room you both share has reached the reveal phase.';

-- People waiting to be matched into a room. A row is removed the moment
-- try_form_room() places that person into a room.
create table public.room_queue (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('contestant','judge')),
  queued_at  timestamptz not null default now(),
  unique (profile_id)
);

-- One live "episode". phase_deadline drives server-authoritative timing —
-- clients render a countdown to it, but only the scheduled advance-room-phases
-- job (or an RPC below) is allowed to actually change `phase`.
create table public.rooms (
  id              uuid primary key default gen_random_uuid(),
  contestant_id   uuid not null references public.profiles(id),
  phase           text not null default 'waiting_room' check (phase in (
                    'waiting_room','intro','countdown','round1','round1_results',
                    'round2_question','round2_answer','round2_decision','round2_results',
                    'reveal','final','closed'
                  )),
  phase_deadline  timestamptz,
  created_at      timestamptz not null default now(),
  closed_at       timestamptz
);

-- Who's in a given room, and their decisions. Decisions are written through
-- the submit_decision() RPC below, not direct client UPDATEs, so the server
-- can enforce "only during the right phase, only your own row."
create table public.room_participants (
  room_id          uuid not null references public.rooms(id) on delete cascade,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  role             text not null check (role in ('contestant','judge')),
  round1_decision  text not null default 'pending' check (round1_decision in ('pending','keep','pop')),
  round2_decision  text not null default 'pending' check (round2_decision in ('pending','keep','pop')),
  joined_at        timestamptz not null default now(),
  primary key (room_id, profile_id)
);

-- Append-only event log for a room: host lines, submitted decisions, the
-- contestant's live personality answer, the final pick. This is what
-- Realtime clients subscribe to for the moment-to-moment feed, and it
-- doubles as an audit trail.
create table public.room_events (
  id         bigint generated always as identity primary key,
  room_id    uuid not null references public.rooms(id) on delete cascade,
  event_type text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.matches (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms(id),
  profile_id_a   uuid not null references public.profiles(id),
  profile_id_b   uuid not null references public.profiles(id),
  created_at     timestamptz not null default now(),
  unique (room_id)
);

create table public.messages (
  id         bigint generated always as identity primary key,
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id),
  text       text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- Helpful indexes for the lookups the app actually does.
create index on public.room_participants (profile_id);
create index on public.room_events (room_id, created_at);
create index on public.messages (match_id, created_at);
create index on public.room_queue (role, queued_at);

-- -----------------------------------------------------------------------------
-- New-user trigger: create a profile row the moment someone signs up.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New player'));
  insert into public.profile_reveal (profile_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.profile_reveal   enable row level security;
alter table public.room_queue       enable row level security;
alter table public.rooms            enable row level security;
alter table public.room_participants enable row level security;
alter table public.room_events      enable row level security;
alter table public.matches          enable row level security;
alter table public.messages         enable row level security;

-- RLS controls *which rows* a role can see; it doesn't grant access to the
-- table at all on its own. Being explicit here rather than assuming
-- Supabase's project-level defaults already cover every table.
grant select on public.profiles, public.profile_reveal, public.rooms,
  public.room_participants, public.room_events, public.matches, public.messages
  to authenticated;
grant insert, delete on public.room_queue to authenticated;
grant update on public.profiles, public.profile_reveal to authenticated;
grant insert on public.messages to authenticated;

-- profiles: round-1 info is meant to be visible to other signed-in players.
create policy "profiles are readable by any signed-in user"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- profile_reveal: the actual security boundary. Own row always visible;
-- someone else's row only once a shared room has reached the reveal phase.
create policy "reveal info visible to self, or after a shared room reveals it"
  on public.profile_reveal for select
  using (
    profile_id = auth.uid()
    or exists (
      select 1
      from public.room_participants rp_me
      join public.room_participants rp_them
        on rp_them.room_id = rp_me.room_id
      join public.rooms r
        on r.id = rp_me.room_id
      where rp_me.profile_id = auth.uid()
        and rp_them.profile_id = profile_reveal.profile_id
        and r.phase in ('reveal','final','closed')
    )
  );

create policy "users can edit their own reveal info"
  on public.profile_reveal for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- room_queue: you can see and remove your own queue entry (e.g. "cancel").
create policy "users manage their own queue entry"
  on public.room_queue for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- rooms: only visible to people actually in them. No client-facing UPDATE
-- policy — phase changes happen through advance-room-phases (service role),
-- which bypasses RLS.
create policy "participants can see their own room"
  on public.rooms for select
  using (
    exists (
      select 1 from public.room_participants
      where room_id = rooms.id and profile_id = auth.uid()
    )
  );

-- room_participants: participants can see the roster of rooms they're in.
-- No client-facing UPDATE policy — decisions go through submit_decision().
create policy "participants can see their room's roster"
  on public.room_participants for select
  using (
    exists (
      select 1 from public.room_participants me
      where me.room_id = room_participants.room_id and me.profile_id = auth.uid()
    )
  );

-- room_events: participants can read the live feed for their room. No
-- client-facing INSERT — events are written by RPCs/edge functions that
-- validate what's actually allowed to happen.
create policy "participants can read their room's event feed"
  on public.room_events for select
  using (
    exists (
      select 1 from public.room_participants
      where room_id = room_events.room_id and profile_id = auth.uid()
    )
  );

-- matches: visible to the two people in them.
create policy "matched users can see their match"
  on public.matches for select
  using (profile_id_a = auth.uid() or profile_id_b = auth.uid());

-- messages: only the two matched people can read or send.
create policy "matched users can read their messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (matches.profile_id_a = auth.uid() or matches.profile_id_b = auth.uid())
    )
  );

create policy "matched users can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches
      where matches.id = messages.match_id
        and (matches.profile_id_a = auth.uid() or matches.profile_id_b = auth.uid())
    )
  );

-- -----------------------------------------------------------------------------
-- submit_decision(): the only way a client can record a keep/pop. Runs as
-- the calling user (auth.uid()) — never trusts a client-supplied profile id
-- — and checks the room is actually in the right phase before accepting it.
-- -----------------------------------------------------------------------------
create or replace function public.submit_decision(p_room_id uuid, p_round int, p_decision text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_phase text;
begin
  if p_decision not in ('keep','pop') then
    raise exception 'invalid decision: %', p_decision;
  end if;
  if p_round not in (1,2) then
    raise exception 'invalid round: %', p_round;
  end if;

  select phase into v_phase from public.rooms where id = p_room_id;
  if v_phase is null then
    raise exception 'room not found';
  end if;

  if p_round = 1 and v_phase <> 'round1' then
    raise exception 'round 1 is not currently accepting decisions (room is in %)', v_phase;
  end if;
  if p_round = 2 and v_phase <> 'round2_decision' then
    raise exception 'round 2 is not currently accepting decisions (room is in %)', v_phase;
  end if;

  if p_round = 1 then
    update public.room_participants
    set round1_decision = p_decision
    where room_id = p_room_id and profile_id = auth.uid() and role = 'judge';
  else
    update public.room_participants
    set round2_decision = p_decision
    where room_id = p_room_id and profile_id = auth.uid() and role = 'judge';
  end if;

  if not found then
    raise exception 'you are not a judge in this room';
  end if;

  insert into public.room_events (room_id, event_type, payload)
  values (p_room_id, 'decision_submitted',
    jsonb_build_object('profile_id', auth.uid(), 'round', p_round, 'decision', p_decision));
end;
$$;

grant execute on function public.submit_decision(uuid,int,text) to authenticated;

-- -----------------------------------------------------------------------------
-- join_queue(): a client calls this instead of inserting into room_queue
-- directly, so it can enforce "one active queue entry per person" cleanly
-- and immediately try to form a room in the same call.
-- -----------------------------------------------------------------------------
create or replace function public.join_queue(p_role text)
returns uuid  -- returns a room id if one formed immediately, else null
language plpgsql
security definer set search_path = public
as $$
begin
  if p_role not in ('contestant','judge') then
    raise exception 'invalid role: %', p_role;
  end if;

  insert into public.room_queue (profile_id, role)
  values (auth.uid(), p_role)
  on conflict (profile_id) do update set role = excluded.role, queued_at = now();

  return public.try_form_room();
end;
$$;

grant execute on function public.join_queue(text) to authenticated;

-- -----------------------------------------------------------------------------
-- try_form_room(): the matchmaker. Safe to call concurrently — uses
-- `for update skip locked` so two simultaneous callers can't grab the same
-- queued person. Requires min_judges before it'll start a room; if traffic
-- is too low, callers should fall back to the app's existing bot-simulated
-- room rather than waiting indefinitely.
-- -----------------------------------------------------------------------------
create or replace function public.try_form_room(min_judges int default 2, max_judges int default 5)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_contestant_id uuid;
  v_room_id       uuid;
  v_judge_count   int;
begin
  select profile_id into v_contestant_id
  from public.room_queue
  where role = 'contestant'
  order by queued_at
  limit 1
  for update skip locked;

  if v_contestant_id is null then
    return null;
  end if;

  select count(*) into v_judge_count from public.room_queue where role = 'judge';
  if v_judge_count < min_judges then
    return null;
  end if;

  insert into public.rooms (contestant_id, phase, phase_deadline)
  values (v_contestant_id, 'intro', now() + interval '8 seconds')
  returning id into v_room_id;

  insert into public.room_participants (room_id, profile_id, role)
  values (v_room_id, v_contestant_id, 'contestant');

  insert into public.room_participants (room_id, profile_id, role)
  select v_room_id, picked.profile_id, 'judge'
  from (
    select profile_id
    from public.room_queue
    where role = 'judge'
    order by queued_at
    limit max_judges
    for update skip locked
  ) picked;

  delete from public.room_queue where profile_id = v_contestant_id;
  delete from public.room_queue
  where role = 'judge'
    and profile_id in (select profile_id from public.room_participants where room_id = v_room_id);

  insert into public.room_events (room_id, event_type, payload)
  values (v_room_id, 'room_formed', jsonb_build_object('contestant_id', v_contestant_id));

  return v_room_id;
end;
$$;

-- Deliberately not granted to authenticated/anon — only the scheduled cron
-- job (via join_queue, or directly as the job owner) should form rooms.
revoke execute on function public.try_form_room(int,int) from public, authenticated, anon;

-- Retry matchmaking periodically in case judges queue up after a contestant
-- is already waiting (join_queue only tries once, at the moment of insert).
-- NOTE: some Supabase projects' pg_cron only accepts minute-granularity
-- schedules — if the sub-minute syntax below is rejected, fall back to
-- '* * * * *' (every minute) or drive this from a scheduled Edge Function
-- instead.
select cron.schedule('try-form-room', '10 seconds', $$select public.try_form_room();$$);

-- -----------------------------------------------------------------------------
-- Realtime: expose the tables clients need to subscribe to for live sync.
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_participants;
alter publication supabase_realtime add table public.room_events;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.messages;
