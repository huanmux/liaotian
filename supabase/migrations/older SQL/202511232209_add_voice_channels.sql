create table public.active_voice_sessions (
  id uuid not null default gen_random_uuid(),
  channel_id uuid not null references public.gazebo_channels(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  peer_id text not null,
  joined_at timestamp with time zone default now(),
  primary key (id),
  unique (channel_id, user_id)
);

-- Enable RLS
alter table public.active_voice_sessions enable row level security;

-- Allow anyone to read
create policy "Public read access" on public.active_voice_sessions for select using (true);

-- Allow authenticated users to insert/delete their own rows
create policy "Users can insert their own session" on public.active_voice_sessions for insert with check (auth.uid() = user_id);
create policy "Users can delete their own session" on public.active_voice_sessions for delete using (auth.uid() = user_id);
