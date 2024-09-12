create table public.audio_providers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    url text not null,
    max_concurrent_requests int not null check (max_concurrent_requests > 0),
    created_at timestamptz not null default now()
);

create table public.provider_audio_version (
    provider_id uuid not null,
    audio_version_id uuid not null,
    constraint fk_provider foreign key (provider_id) references public.audio_providers(id) on delete cascade,
    constraint fk_audio_version foreign key (audio_version_id) references public.audio_version(id) on delete cascade,
    primary key (provider_id, audio_version_id)
);

create table public.provider_audio_screenplay_versions (
    provider_id uuid not null,
    audio_screenplay_version_id uuid not null,
    constraint fk_provider foreign key (provider_id) references public.audio_providers(id) on delete cascade,
    constraint fk_audio_screenplay_version foreign key (audio_screenplay_version_id) references public.audio_screenplay_versions(id) on delete cascade,
    primary key (provider_id, audio_screenplay_version_id)
);

-- Enable row level security for providers
alter table public.audio_providers enable row level security;

-- Policy to allow read access for all authenticated users
create policy "allow read access for all authenticated users" on public.audio_providers for
select to authenticated using (true);

-- Policy to allow insert only for authenticated users
create policy "allow insert for authenticated users" on public.audio_providers for
insert with check (auth.uid() is not null);

-- Policy to allow update for authorized users (e.g., admins)
create policy "allow update for authorized users" on public.audio_providers for
update using (auth.role() = 'admin');

-- Policy to allow delete for authorized users (e.g., admins)
create policy "allow delete for authorized users" on public.audio_providers for
delete using (auth.role() = 'admin');