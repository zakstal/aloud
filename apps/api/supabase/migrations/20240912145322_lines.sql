create table public.lines (
    id uuid primary key default gen_random_uuid(),
    screenplay_id uuid not null,
    character_id uuid not null,
    text text not null,
    "order" int not null,
    -- line_obj: jsonb,
    created_at timestamptz not null default now(),
    constraint fk_line_screenplay foreign key (screenplay_id) references public.screenplays(id) on delete cascade,
    constraint fk_line_character foreign key (character_id) references public.characters(id) on delete cascade
);

create index idx_lines_screenplay_id on public.lines(screenplay_id);
create index idx_lines_character_id on public.lines(character_id);

-- row-level security policies for lines
alter table public.lines enable row level security;

create policy "allow read access for all authenticated users" on public.lines for
select to authenticated using (true);

create policy "allow insert for authenticated users" on public.lines for
insert with check (auth.uid() = (select user_id from public.screenplays where id = screenplay_id));

create policy "allow update for line owners" on public.lines for
update using (auth.uid() = (select user_id from public.screenplays where id = screenplay_id));

create policy "allow delete for line owners" on public.lines for
delete using (auth.uid() = (select user_id from public.screenplays where id = screenplay_id));
