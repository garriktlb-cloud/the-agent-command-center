
-- Create task_type enum
CREATE TYPE public.task_type AS ENUM ('todo', 'email', 'call', 'meeting', 'follow_up', 'document');

-- Add new columns to tasks table
ALTER TABLE public.tasks
  ADD COLUMN task_type public.task_type NOT NULL DEFAULT 'todo',
  ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Index for subtask lookups
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_contact_id ON public.tasks(contact_id);
CREATE INDEX idx_tasks_task_type ON public.tasks(task_type);
