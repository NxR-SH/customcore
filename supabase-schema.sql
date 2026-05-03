-- Schema SQL pour Supabase - FiveM Dev Pro
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateur
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    server_name TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des devis
CREATE TABLE quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    server_name TEXT,
    project_type TEXT NOT NULL CHECK (project_type IN ('creation', 'modification', 'debug', 'systems')),
    project_details TEXT NOT NULL,
    framework TEXT NOT NULL DEFAULT 'esx',
    deadline TEXT,
    budget TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid', 'invoiced')),
    hourly_rate DECIMAL(10,2) DEFAULT 25.00,
    estimated_hours DECIMAL(10,2),
    total_price DECIMAL(10,2),
    vat DECIMAL(10,2),
    total_with_vat DECIMAL(10,2),
    approved_date TIMESTAMP WITH TIME ZONE,
    rejected_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures
CREATE TABLE invoices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    subtotal DECIMAL(10,2) NOT NULL,
    vat DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des abonnements
CREATE TABLE subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
    next_billing TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Utilisateur'),
        CASE 
            WHEN NEW.email = 'nxrsh27@gmail.com' THEN 'admin'
            ELSE 'client'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour générer les numéros de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    next_number INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-\d{4}-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || year_part || '-%';
    
    sequence_part := LPAD(next_number::TEXT, 3, '0');
    
    RETURN 'INV-' || year_part || '-' || sequence_part;
END;
$$ LANGUAGE plpgsql;

-- Policies RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
CREATE POLICY "Admins can update all profiles" ON user_profiles FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policies pour quotes
CREATE POLICY "Users can view own quotes" ON quotes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create quotes" ON quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all quotes" ON quotes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
CREATE POLICY "Admins can update all quotes" ON quotes FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policies pour invoices
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all invoices" ON invoices FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
CREATE POLICY "Admins can create invoices" ON invoices FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
CREATE POLICY "Admins can update invoices" ON invoices FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policies pour subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON subscriptions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
CREATE POLICY "Admins can create subscriptions" ON subscriptions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
CREATE POLICY "Admins can update all subscriptions" ON subscriptions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Insérer le compte admin (sera créé automatiquement lors de la première connexion)
-- Le compte admin doit être créé manuellement via l'interface Supabase Auth
-- avec l'email nxrsh27@gmail.com

-- Table pour les éléments du portfolio
CREATE TABLE portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    technologies TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les avis clients
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger pour updated_at sur portfolio_items
CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour updated_at sur reviews
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS pour portfolio_items
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Politique pour portfolio_items - lecture publique
CREATE POLICY "Portfolio items are viewable by everyone" ON portfolio_items
    FOR SELECT USING (is_active = true);

-- Politique pour portfolio_items - admin peut tout faire
CREATE POLICY "Admins can manage portfolio items" ON portfolio_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- RLS pour reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Politique pour reviews - lecture des avis approuvés
CREATE POLICY "Approved reviews are viewable by everyone" ON reviews
    FOR SELECT USING (is_approved = true);

-- Politique pour reviews - utilisateurs peuvent créer leurs avis
CREATE POLICY "Users can create their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour reviews - utilisateurs peuvent modifier leurs avis non approuvés
CREATE POLICY "Users can update their own pending reviews" ON reviews
    FOR UPDATE USING (
        auth.uid() = user_id AND is_approved = false
    );

-- Politique pour reviews - admin peut tout faire
CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Insérer quelques éléments de portfolio par défaut (vides pour commencer)
INSERT INTO portfolio_items (title, description, tags, technologies, display_order) VALUES
('Projet à venir', 'Votre premier projet apparaîtra ici une fois ajouté via le panneau d''administration.', '{"En attente"}', '{"FiveM"}', 1);

-- Index pour les performances
CREATE INDEX idx_portfolio_items_active_order ON portfolio_items(is_active, display_order);
CREATE INDEX idx_reviews_approved_featured ON reviews(is_approved, is_featured);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);