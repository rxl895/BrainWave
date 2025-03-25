-- Create a function to add the creator as admin
CREATE OR REPLACE FUNCTION public.handle_new_study_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is already a member before inserting
  IF NOT EXISTS (
    SELECT 1 FROM public.study_group_members 
    WHERE study_group_id = NEW.id AND user_id = NEW.owner_id
  ) THEN
    INSERT INTO public.study_group_members (study_group_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that calls the function after a new study group is inserted
DROP TRIGGER IF EXISTS study_group_created ON public.study_groups;
CREATE TRIGGER study_group_created
  AFTER INSERT ON public.study_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_study_group(); 