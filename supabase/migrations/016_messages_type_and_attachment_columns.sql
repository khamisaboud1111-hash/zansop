-- 016: restore missing messages.message_type / messages.attachment_url
--
-- Migration 013 declares both columns, but they were never present on the
-- live database. The chat RPCs (send_message / get_messages) reference them,
-- so every insert and read of the messages table failed:
--   ERROR: column "message_type" of relation "messages" does not exist
-- That made the chat pages load but never show or send a message.

alter table public.messages
  add column if not exists message_type text not null default 'text';

alter table public.messages
  add column if not exists attachment_url text;

-- Keep the same constraint 013 declared, but only if the check was not
-- carried over. Done separately so an existing constraint is not duplicated.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.messages'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%message_type%'
  ) then
    alter table public.messages
      add constraint messages_message_type_check
      check (message_type in ('text', 'image', 'product_card', 'system'));
  end if;
end $$;
