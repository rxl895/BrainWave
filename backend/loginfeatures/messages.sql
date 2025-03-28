-- Create Messages Table
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    content text not null,
    sender_id uuid references auth.users(id) on delete cascade not null,
    group_id uuid references public.study_groups(id) on delete cascade not null
);

-- Enable RLS
alter table public.messages enable row level security;

-- Create policies
create policy "Users can view messages in groups they belong to"
    on public.messages
    for select
    using (
        exists (
            select 1 
            from public.study_group_members sgm 
            where sgm.study_group_id = group_id 
            and sgm.user_id = auth.uid()
        )
        or
        exists (
            select 1 
            from public.study_groups sg 
            where sg.id = group_id 
            and (
                not sg.is_private 
                or sg.owner_id = auth.uid()
            )
        )
    );

create policy "Users can send messages to groups they belong to"
    on public.messages
    for insert
    with check (
        auth.uid() = sender_id
        and
        (
            exists (
                select 1 
                from public.study_group_members sgm 
                where sgm.study_group_id = group_id 
                and sgm.user_id = auth.uid()
            )
            or
            exists (
                select 1 
                from public.study_groups sg 
                where sg.id = group_id 
                and sg.owner_id = auth.uid()
            )
        )
    );

-- Add policy for message deletion (only message sender can delete)
create policy "Users can delete their own messages"
    on public.messages
    for delete
    using (auth.uid() = sender_id);

-- Add Realtime Publication for Messages
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.messages;

-- Create index for faster queries
create index messages_group_id_idx on public.messages(group_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_created_at_idx on public.messages(created_at); 