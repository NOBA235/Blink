-- =============================================================================
--Blink phase engine

-- -----------------------------------------------------------------------------
create or replace function public.submit_personality_answer(p_room_id uuid, p_answer text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_phase text;
  v_contestant_id uuid;
begin
  select phase, contestant_id into v_phase, v_contestant_id
  from public.rooms where id = p_room_id;

  if v_contestant_id is null then
    raise exception 'room not found';
  end if;
  if v_contestant_id is distinct from auth.uid() then
    raise exception 'only the contestant can answer the personality question';
  end if;
  if v_phase <> 'round2_question' then
    raise exception 'not currently accepting the personality answer (room is in %)', v_phase;
  end if;
  if length(trim(p_answer)) = 0 then
    raise exception 'answer cannot be empty';
  end if;

  insert into public.room_events (room_id, event_type, payload)
  values (p_room_id, 'personality_answer', jsonb_build_object('answer', p_answer));

  update public.rooms
  set phase = 'round2_answer', phase_deadline = now() + interval '18 seconds'
  where id = p_room_id;

  insert into public.room_events (room_id, event_type, payload)
  values (p_room_id, 'phase_changed', jsonb_build_object('phase', 'round2_answer'));
end;
$$;

grant execute on function public.submit_personality_answer(uuid,text) to authenticated;

-- -----------------------------------------------------------------------------
-- advance_room_phases(): the scheduled sweep. Finds every room whose
-- phase_deadline has passed and moves it to the next phase, applying
-- whatever game logic that transition needs (auto-keep on timeout, closing
-- a room nobody's left in, picking the final match).
--
-- A non-response is treated as an implicit "keep" for both rounds, matching
-- the original single-player build's behavior (no action = stay in).
-- -----------------------------------------------------------------------------
create or replace function public.advance_room_phases()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r record;
  v_next_phase text;
  v_next_deadline interval;
  v_remaining int;
  v_pick uuid;
  v_question text;
  v_questions text[] := array[
    'What''s the most spontaneous thing you''ve ever done?',
    'What''s a skill you''re weirdly proud of?',
    'What''s the last thing that made you laugh out loud?',
    'What''s a small thing that instantly improves your day?'
  ];
begin
  for r in
    select * from public.rooms
    where phase_deadline is not null
      and phase_deadline < now()
      and phase not in ('closed','waiting_room')
    for update skip locked
  loop
    v_next_phase := null;
    v_next_deadline := null;

    if r.phase = 'intro' then
      v_next_phase := 'countdown';
      v_next_deadline := interval '4 seconds';

    elsif r.phase = 'countdown' then
      v_next_phase := 'round1';
      v_next_deadline := interval '20 seconds';

    elsif r.phase = 'round1' then
      update public.room_participants
      set round1_decision = 'keep'
      where room_id = r.id and role = 'judge' and round1_decision = 'pending';

      select count(*) into v_remaining
      from public.room_participants
      where room_id = r.id and role = 'judge' and round1_decision = 'keep';

      if v_remaining = 0 then
        v_next_phase := 'closed';
        insert into public.room_events (room_id, event_type, payload)
          values (r.id, 'room_closed', jsonb_build_object('reason', 'no_judges_remaining'));
      else
        v_next_phase := 'round1_results';
        v_next_deadline := interval '5 seconds';
      end if;

    elsif r.phase = 'round1_results' then
      v_next_phase := 'round2_question';
      v_next_deadline := interval '15 seconds';
      v_question := v_questions[floor(random() * array_length(v_questions,1) + 1)];
      insert into public.room_events (room_id, event_type, payload)
        values (r.id, 'personality_question', jsonb_build_object('question', v_question));

    elsif r.phase = 'round2_question' then
      -- Fallback if the contestant never submitted an answer in time.
      v_next_phase := 'round2_answer';
      v_next_deadline := interval '18 seconds';
      insert into public.room_events (room_id, event_type, payload)
        values (r.id, 'personality_answer', jsonb_build_object('answer', null, 'timed_out', true));

    elsif r.phase = 'round2_answer' then
      v_next_phase := 'round2_decision';
      v_next_deadline := interval '18 seconds';

    elsif r.phase = 'round2_decision' then
      update public.room_participants
      set round2_decision = 'keep'
      where room_id = r.id and role = 'judge'
        and round1_decision = 'keep' and round2_decision = 'pending';

      select count(*) into v_remaining
      from public.room_participants
      where room_id = r.id and role = 'judge'
        and round1_decision = 'keep' and round2_decision = 'keep';

      if v_remaining = 0 then
        v_next_phase := 'closed';
        insert into public.room_events (room_id, event_type, payload)
          values (r.id, 'room_closed', jsonb_build_object('reason', 'no_judges_remaining'));
      else
        v_next_phase := 'round2_results';
        v_next_deadline := interval '5 seconds';
      end if;

    elsif r.phase = 'round2_results' then
      v_next_phase := 'reveal';
      v_next_deadline := interval '14 seconds';

    elsif r.phase = 'reveal' then
      v_next_phase := 'final';
      v_next_deadline := interval '5 seconds';

    elsif r.phase = 'final' then
      -- Uniform random among whoever survived both rounds — there's no
      -- "the user" to weight toward server-side, since every remaining
      -- judge here is an equally real person.
      select profile_id into v_pick
      from public.room_participants
      where room_id = r.id and role = 'judge'
        and round1_decision = 'keep' and round2_decision = 'keep'
      order by random()
      limit 1;

      if v_pick is not null then
        insert into public.matches (room_id, profile_id_a, profile_id_b)
        values (r.id, r.contestant_id, v_pick)
        on conflict (room_id) do nothing;

        insert into public.room_events (room_id, event_type, payload)
          values (r.id, 'match_created', jsonb_build_object('profile_id', v_pick));
      else
        insert into public.room_events (room_id, event_type, payload)
          values (r.id, 'no_match', '{}'::jsonb);
      end if;

      v_next_phase := 'closed';
    end if;

    if v_next_phase is not null then
      update public.rooms
      set phase = v_next_phase,
          phase_deadline = case when v_next_deadline is null then null else now() + v_next_deadline end,
          closed_at = case when v_next_phase = 'closed' then now() else closed_at end
      where id = r.id;

      insert into public.room_events (room_id, event_type, payload)
        values (r.id, 'phase_changed', jsonb_build_object('phase', v_next_phase));
    end if;
  end loop;
end;
$$;

-- Not callable by clients — only the scheduled job should advance phases.
revoke execute on function public.advance_room_phases() from public, authenticated, anon;

-- NOTE: same sub-minute caveat as the matchmaking schedule in 0001 — if your
-- project's pg_cron rejects '5 seconds', use '* * * * *' (every minute, much
-- coarser) or trigger this from a scheduled Edge Function instead.
select cron.schedule('advance-room-phases', '5 seconds', $$select public.advance_room_phases();$$);
