-- Créer la table de suivi des demandes Jotform
CREATE TABLE IF NOT EXISTS public.jotform_demandes (
    id text PRIMARY KEY,
    form_id text,
    opened boolean DEFAULT false,
    status text DEFAULT 'nouveau',
    opened_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.jotform_demandes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Autoriser tout sur jotform_demandes" ON public.jotform_demandes;
CREATE POLICY "Autoriser tout sur jotform_demandes" ON public.jotform_demandes AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
