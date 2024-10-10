create table public.audio_screenplay_versions (
    id uuid primary key default gen_random_uuid(),
    screenplay_id uuid not null,
    version_number int not null, -- to track different versions
    audio_file_url text, -- URL to the full/partial assembled audio file
    is_final boolean not null default false, -- flag to indicate if this is the final version
    status text check (status in ('partial', 'full')) default 'partial',
    created_at timestamptz not null default now(),
    constraint fk_audio_screenplay_screenplay foreign key (screenplay_id) references public.screenplays(id) on delete cascade
);

create index idx_audio_screenplay_versions_screenplay_id on public.audio_screenplay_versions(screenplay_id);

-- row-level security policies for audio screenplay versions
alter table public.audio_screenplay_versions enable row level security;

create policy "allow read access for all authenticated users" on public.audio_screenplay_versions for
select to authenticated using (true);

create policy "allow insert for authenticated users" on public.audio_screenplay_versions for
insert with check (auth.uid() = (select user_id from public.screenplays where id = screenplay_id));

create policy "allow update for version owners" on public.audio_screenplay_versions for
update using (auth.uid() = (select user_id from public.screenplays where id = screenplay_id));

create policy "allow delete for version owners" on public.audio_screenplay_versions for
delete using (auth.uid() = (select user_id from public.screenplays where id = screenplay_id));

create trigger audio_screenplay_versions_updated_at before update on public.audio_screenplay_versions
for each row execute function update_updated_at();