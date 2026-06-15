-- ==========================================
-- SCHEMA DE BASE DE DONNÉES SUPABASE
-- BRIGADE MOBILE (Application Complète)
-- ==========================================

-- 1. Table des ventes et réparations principales
CREATE TABLE IF NOT EXISTS public.sales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client text,
    clientphone text,
    email text,
    phone text,
    service text,
    type text DEFAULT 'Réparation',
    price numeric DEFAULT 0,
    cost numeric DEFAULT 0,
    profit numeric DEFAULT 0,
    status text DEFAULT 'En attente',
    paymentmethod text DEFAULT 'Espèces',
    notes text,
    imei text,
    acompte numeric DEFAULT 0,
    unlock_code text,
    date text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Table des factures
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    clientname text,
    clientphone text,
    clientaddress text,
    imei text,
    total numeric DEFAULT 0,
    items jsonb DEFAULT '[]'::jsonb,
    notes text,
    createdat timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Table de la grille tarifaire
CREATE TABLE IF NOT EXISTS public.grille_tarifaire (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    model text NOT NULL,
    repair text NOT NULL,
    price numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(model, repair)
);

-- 4. Table pour l'organisation Kanban (Tickets de réparation)
CREATE TABLE IF NOT EXISTS public.repair_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    client text,
    phone text,
    status text DEFAULT 'À faire',
    position integer DEFAULT 0,
    price numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- ==========================================
-- Active la sécurité niveau ligne (RLS)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grille_tarifaire ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_tickets ENABLE ROW LEVEL SECURITY;

-- Crée des règles pour autoriser toutes les opérations (Lecture, Écriture, Suppression)
-- Idéal pour un logiciel de gestion interne
CREATE POLICY "Autoriser tout sur sales" ON public.sales AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Autoriser tout sur invoices" ON public.invoices AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Autoriser tout sur grille_tarifaire" ON public.grille_tarifaire AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Autoriser tout sur repair_tickets" ON public.repair_tickets AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Table de gestion de stock
CREATE TABLE IF NOT EXISTS public.stock (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text,
    quantity numeric DEFAULT 0,
    price numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Autoriser tout sur stock" ON public.stock AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. Table de gestion de stock écran
CREATE TABLE IF NOT EXISTS public.stock_ecran (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    category text,
    quantity numeric DEFAULT 0,
    price numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.stock_ecran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Autoriser tout sur stock_ecran" ON public.stock_ecran;
CREATE POLICY "Autoriser tout sur stock_ecran" ON public.stock_ecran AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);


