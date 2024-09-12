create table public.screenplays (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null, -- links to users table
    title text not null,
    type text check (type in ('movie', 'tv_show')) not null,
    total_lines int not null default 0,
    completion_status text check (completion_status in ('pending', 'partial', 'completed')) default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint fk_screenplay_user foreign key (user_id) references public.users(id) on delete cascade
);

create index idx_screenplays_user_id on public.screenplays(user_id);

-- row-level security policies
alter table public.screenplays enable row level security;

create policy "allow read access for all authenticated users" on public.screenplays for
select to authenticated using (true);

create policy "allow insert for authenticated users" on public.screenplays for
insert with check (auth.uid() = user_id);

create policy "allow update for screenplay owners" on public.screenplays for
update using (auth.uid() = user_id);

create policy "allow delete for screenplay owners" on public.screenplays for
delete using (auth.uid() = user_id);
