create table public.audio_character_version (
    id uuid primary key default gen_random_uuid(),
    audio_screenplay_version_id uuid not null,
    provider_id uuid,
    voice_data jsonb,
    voice_id text,
    voice_name text,
    character_id uuid not null,
    created_at timestamptz not null default now(),
    version_number int not null,
    constraint fk_audio_screenplay_version foreign key (audio_screenplay_version_id) references public.audio_screenplay_versions(id) on delete cascade,
    constraint fk_provider foreign key (provider_id) references public.audio_providers(id) on delete cascade,
    constraint fk_character foreign key (character_id) references public.characters(id) on delete cascade
);

create index idx_audio_character_version_audio_screenplay_version_id on public.audio_character_version(audio_screenplay_version_id);

alter table public.audio_version
add column audio_character_version_id uuid not null,
add column audio_screenplay_version_id uuid not null,
add constraint fk_audio_version_audio_screenplay_version foreign key (audio_screenplay_version_id) references public.audio_screenplay_versions(id) on delete cascade,
add constraint fk_audio_character_version foreign key (audio_character_version_id) references public.audio_character_version(id) on delete cascade;


alter table public.audio_jobs
add column audio_character_version_id uuid not null,
add constraint fk_audio_character_version foreign key (audio_character_version_id) references public.audio_character_version(id) on delete cascade

