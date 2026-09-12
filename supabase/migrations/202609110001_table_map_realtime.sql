-- The staff table map listens to table configuration changes as well as order changes.
do $$ begin
  alter publication supabase_realtime add table public.tables;
exception when duplicate_object then null;
end $$;
