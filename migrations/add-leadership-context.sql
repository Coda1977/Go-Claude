-- Add leadership context fields to users table
ALTER TABLE users 
ADD COLUMN current_role text,
ADD COLUMN team_size text,
ADD COLUMN industry text,
ADD COLUMN years_in_leadership integer,
ADD COLUMN work_environment text,
ADD COLUMN organization_size text,
ADD COLUMN leadership_challenges text[];

-- Set default values for existing users (if any)
UPDATE users 
SET 
  current_role = 'Manager',
  team_size = '1-5',
  industry = 'Other',
  years_in_leadership = 1,
  work_environment = 'Hybrid'
WHERE current_role IS NULL;

-- Make required fields NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN current_role SET NOT NULL,
ALTER COLUMN team_size SET NOT NULL,
ALTER COLUMN industry SET NOT NULL,
ALTER COLUMN years_in_leadership SET NOT NULL,
ALTER COLUMN work_environment SET NOT NULL;