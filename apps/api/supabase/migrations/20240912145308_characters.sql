create table public.characters (
    id uuid primary key default gen_random_uuid(),
    screenplay_id uuid not null,
    name text not null,
    gender text not null,
    created_at timestamptz not null default now(),
    constraint fk_character_screenplay foreign key (screenplay_id) references public.screenplays(id) on delete cascade
);

create index idx_characters_screenplay_id on public.characters(screenplay_id);

-- No need for specific RLS policies since access to characters is governed by screenplay access.
