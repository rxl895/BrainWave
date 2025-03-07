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

-- Drop existing policies if they exist
drop policy if exists "Users can view all public study groups" on public.study_groups;
drop policy if exists "Owner can update their study groups" on public.study_groups;
drop policy if exists "Owner can delete their study groups" on public.study_groups;
drop policy if exists "Authenticated users can create study groups" on public.study_groups;
drop policy if exists "Users can view private groups they belong to" on public.study_groups;

-- Create updated policies
create policy "Study groups visibility"
    on public.study_groups
    for select
    using (
        not is_private 
        or auth.uid() = owner_id
    );

create policy "Owner can manage their study groups"
    on public.study_groups
    for all
    using (auth.uid() = owner_id);

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

-- Drop existing policies if they exist
drop policy if exists "Users can view members of groups they belong to" on public.study_group_members;
drop policy if exists "Group owners can manage members" on public.study_group_members;
drop policy if exists "Users can join public groups" on public.study_group_members;

-- Create policies with fixed recursion issue
create policy "Users can view members of groups they belong to"
    on public.study_group_members
    for select
    using (
        exists (
            select 1 
            from public.study_groups sg 
            where sg.id = study_group_id 
            and (
                not sg.is_private 
                or auth.uid() = sg.owner_id 
                or auth.uid() = user_id
            )
        )
    );

create policy "Group owners can manage members"
    on public.study_group_members
    for all
    using (
        exists (
            select 1 
            from public.study_groups sg 
            where sg.id = study_group_id 
            and sg.owner_id = auth.uid()
        )
    );

create policy "Users can join public groups"
    on public.study_group_members
    for insert
    with check (
        auth.uid() = user_id 
        and exists (
            select 1 
            from public.study_groups sg 
            where sg.id = study_group_id 
            and not sg.is_private
        )
    );