create table public.audio_version (
    id uuid primary key default gen_random_uuid(),
    line_id uuid not null,
    version_number int not null,
    audio_file_url text not null,
    created_at timestamptz not null default now(),
    constraint fk_audio_version_line foreign key (line_id) references public.lines(id) on delete cascade
);

create index idx_audio_version_line_id on public.audio_version(line_id);

-- row-level security policies for audio versions
alter table public.audio_version enable row level security;

create policy "allow read access for all authenticated users" on public.audio_version for
select to authenticated using (true);

create policy "allow insert for authenticated users" on public.audio_version for
insert with check (auth.uid() = (select user_id from public.screenplays where id = (select screenplay_id from public.lines where id = line_id)));

create policy "allow update for version owners" on public.audio_version for
update using (auth.uid() = (select user_id from public.screenplays where id = (select screenplay_id from public.lines where id = line_id)));

create policy "allow delete for version owners" on public.audio_version for
delete using (auth.uid() = (select user_id from public.screenplays where id = (select screenplay_id from public.lines where id = line_id)));
