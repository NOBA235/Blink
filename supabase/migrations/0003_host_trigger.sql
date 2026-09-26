-- =============================================================================
-- Blink — AI host trigger


create extension if not exists pg_net;

-- One-time setup — run these two lines yourself after creating your project,
-- with your real values. Keeping them here as database settings (rather than
-- hardcoded into the trigger function) means this migration file never
-- contains your actual service role key.
--
--   alter database postgres set app.settings.host_webhook_url =
--     'https://YOUR-PROJECT-REF.supabase.co/functions/v1/generate-host-line';
--   alter database postgres set app.settings.service_role_key =
--     'YOUR-SERVICE-ROLE-KEY';
--
-- (Service role key, not anon key — this call is server-to-server and the
-- edge function needs elevated access to write room_events regardless of
-- whose row triggered it.)

create or replace function public.notify_host_of_room_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_url text := current_setting('app.settings.host_webhook_url', true);
  v_key text := current_setting('app.settings.service_role_key', true);
begin
  -- Skip silently rather than erroring if the one-time setup above hasn't
  -- been done yet — the room still works, it just won't have a live host.
  if v_url is null or v_key is null then
    return new;
  end if;

  -- Never react to the host's own lines — this trigger fires on every
  -- room_events insert, and host_line rows would otherwise cause the
  -- function to call itself indefinitely.
  if new.event_type = 'host_line' then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object(
      'room_id', new.room_id,
      'event_type', new.event_type,
      'payload', new.payload
    )
  );

  return new;
end;
$$;

create trigger on_room_event_notify_host
  after insert on public.room_events
  for each row
  when (new.event_type in (
    'room_formed','phase_changed','decision_submitted',
    'personality_question','personality_answer','match_created','no_match'
  ))
  execute function public.notify_host_of_room_event();
