create table public.audio_jobs (
    id uuid primary key default gen_random_uuid(),
    line_id uuid not null,
    audio_version_id uuid not null,
    job_status text check (job_status in ('pending', 'in progress', 'completed', 'failed')) default 'pending',
    audio_file_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint fk_audio_job_line foreign key (line_id) references public.lines(id) on delete cascade,
    constraint fk_audio_job_audio_version foreign key (audio_version_id) references public.audio_version(id) on delete cascade
);

create index idx_audio_jobs_line_id on public.audio_jobs(line_id);

-- row-level security policies for audio jobs
alter table public.audio_jobs enable row level security;

create policy "allow read access for all authenticated users" on public.audio_jobs for
select to authenticated using (true);

create policy "allow insert for authenticated users" on public.audio_jobs for
insert with check (auth.uid() = (select user_id from public.screenplays where id = (select screenplay_id from public.lines where id = line_id)));

create policy "allow update for job owners" on public.audio_jobs for
update using (auth.uid() = (select user_id from public.screenplays where id = (select screenplay_id from public.lines where id = line_id)));

create policy "allow delete for job owners" on public.audio_jobs for
delete using (auth.uid() = (select user_id from public.screenplays where id = (select screenplay_id from public.lines where id = line_id)));
