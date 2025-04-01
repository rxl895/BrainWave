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