1: Create Study Group
create table public.study_groups (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    description text,
    owner_id uuid references auth.users(id) not null,
    max_participants integer default 10,
    subject text,
    meeting_link text,
    is_private boolean default false
);

-- Enable RLS (Row Level Security)
alter table public.study_groups enable row level security;

-- Create basic policies (we'll add more later)
create policy "Users can view all public study groups"
    on public.study_groups
    for select
    using (not is_private);

create policy "Owner can update their study groups"
    on public.study_groups
    for update
    using (auth.uid() = owner_id);

create policy "Owner can delete their study groups"
    on public.study_groups
    for delete
    using (auth.uid() = owner_id);

create policy "Authenticated users can create study groups"
    on public.study_groups
    for insert
    with check (auth.uid() = owner_id);


2. Create Study Group Members
create table public.study_group_members (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    study_group_id uuid references public.study_groups(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text default 'member'::text,
    unique(study_group_id, user_id)
);

-- Enable RLS
alter table public.study_group_members enable row level security;

-- Create policies
create policy "Users can view members of groups they belong to"
    on public.study_group_members
    for select
    using (auth.uid() in (
        select user_id 
        from study_group_members 
        where study_group_id = study_group_id
    ));

create policy "Group owners can manage members"
    on public.study_group_members
    for all
    using (auth.uid() in (
        select owner_id 
        from study_groups 
        where id = study_group_id
    ));

create policy "Users can join public groups"
    on public.study_group_members
    for insert
    with check (
        auth.uid() = user_id 
        and not exists (
            select 1 
            from study_groups 
            where id = study_group_id 
            and is_private = true
        )
    );

3. Add Policy for Study Group:
create policy "Users can view private groups they belong to"
    on public.study_groups
    for select
    using (auth.uid() in (
        select user_id 
        from study_group_members 
        where study_group_id = id
    ));