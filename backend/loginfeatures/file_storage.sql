-- Create Files Metadata Table
CREATE TABLE IF NOT EXISTS public.group_files (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id uuid REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
    uploader_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name text NOT NULL,
    file_path text NOT NULL UNIQUE,
    file_size bigint,
    file_type text,
    uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.group_files ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Group members can view files" ON public.group_files;
CREATE POLICY "Group members can view files"
    ON public.group_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.study_group_members sgm 
            WHERE sgm.study_group_id = group_id 
            AND sgm.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 
            FROM public.study_groups sg 
            WHERE sg.id = group_id 
            AND (
                NOT sg.is_private 
                OR sg.owner_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Group members can upload files" ON public.group_files;
CREATE POLICY "Group members can upload files"
    ON public.group_files
    FOR INSERT
    WITH CHECK (
        auth.uid() = uploader_id
        AND
        (
            EXISTS (
                SELECT 1 
                FROM public.study_group_members sgm 
                WHERE sgm.study_group_id = group_id 
                AND sgm.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 
                FROM public.study_groups sg 
                WHERE sg.id = group_id 
                AND sg.owner_id = auth.uid()
            )
        )
    );

-- Add timestamp field to messages table for files
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_file boolean DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_path text; 

-- Storage RLS policies (to be run from Supabase dashboard or via SQL editor)
-- These configure access control for the storage bucket itself

-- First, ensure you've created the 'group-files' bucket in the Supabase dashboard

-- Storage policy for downloading files
BEGIN;
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Group members can download files" ON storage.objects;

-- Create new policy
CREATE POLICY "Group members can download files" 
ON storage.objects FOR SELECT
USING (
    bucket_id = 'group-files' 
    AND (
        EXISTS (
            SELECT 1 
            FROM public.study_group_members sgm 
            JOIN public.group_files gf ON gf.group_id = sgm.study_group_id
            WHERE 
                sgm.user_id = auth.uid() 
                AND split_part(name, '/', 1) = sgm.study_group_id::text
                AND gf.file_path = name
        )
        OR 
        EXISTS (
            SELECT 1 
            FROM public.study_groups sg
            JOIN public.group_files gf ON gf.group_id = sg.id
            WHERE 
                (NOT sg.is_private OR sg.owner_id = auth.uid())
                AND split_part(name, '/', 1) = sg.id::text
                AND gf.file_path = name
        )
    )
);
COMMIT;

-- Storage policy for uploading files
BEGIN;
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Group members can upload files" ON storage.objects;

-- Create new policy
CREATE POLICY "Group members can upload files" 
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'group-files' 
    AND (
        EXISTS (
            SELECT 1 
            FROM public.study_group_members sgm 
            WHERE 
                sgm.user_id = auth.uid() 
                AND split_part(name, '/', 1) = sgm.study_group_id::text
        )
        OR 
        EXISTS (
            SELECT 1 
            FROM public.study_groups sg 
            WHERE 
                sg.owner_id = auth.uid()
                AND split_part(name, '/', 1) = sg.id::text
        )
    )
);
COMMIT;
