-- CivicFix – Akıllı Kent Arıza ve İhbar Yönetim Sistemi
-- Supabase PostgreSQL Veritabanı Şeması (Yeni Özellikler Dahil Tam Sürüm)

-- Gerekli Uzantıların (Extensions) Yüklenmesi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Kullanıcı Profilleri Tablosu (Supabase auth.users tablosu ile ilişkilendirilecek)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'operator', 'field_team')),
    phone_number VARCHAR(50),
    trust_score INT DEFAULT 100,
    reports_count INT DEFAULT 0,
    verified_count INT DEFAULT 0,
    badge VARCHAR(50) DEFAULT 'Yeni Vatandaş',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. İhbarlar (Reports) Tablosu
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'Yol Bakım', 'Su Kaçağı', 'Aydınlatma', 'Atık Yönetimi', 'Trafik/Tabela', 'Park/Ekipman'
    priority VARCHAR(50) DEFAULT 'Normal' CHECK (priority IN ('Düşük', 'Normal', 'Yüksek', 'Acil')),
    status VARCHAR(50) DEFAULT 'Yeni',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    resolved_image_url TEXT,
    upvote_count INT DEFAULT 0,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    priority_score INT DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Status Check kısıtlamasını güncelleme / ekleme
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_status_check CHECK (status IN ('Yeni', 'İnceleniyor', 'Atandı', 'Sahada', 'Çözüldü', 'İptal'));

-- 3. İhbar Resimleri (Report Images) Tablosu
CREATE TABLE IF NOT EXISTS public.report_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    ai_label VARCHAR(150),
    ai_confidence DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. İhbar Yorumları / Günlükleri (Comments / Logs) Tablosu
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Misafir modu için NULL desteği
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- Sadece belediye ekiplerinin görebileceği iç yazışmalar için
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Bildirimler (Notifications) Tablosu
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Teknik Ekip Atamaları (Assignments) Tablosu
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE UNIQUE NOT NULL,
    assigned_team VARCHAR(150) NOT NULL, -- örn. 'Kanalizasyon Ekip A', 'Yol Bakım 3. Bölge'
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 7. Topluluk Doğrulama (Upvotes) Tablosu
CREATE TABLE IF NOT EXISTS public.upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(report_id, user_id)
);

-- ----------------------------------------------------
-- Tetikleyiciler (Triggers) ve Otomatik Fonksiyonlar
-- ----------------------------------------------------

-- updated_at Sütununu Güncelleyen Yardımcı Fonksiyon
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles Tablosu İçin updated_at Tetikleyicisi
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Reports Tablosu İçin updated_at Tetikleyicisi
DROP TRIGGER IF EXISTS trigger_reports_updated_at ON public.reports;
CREATE TRIGGER trigger_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Yeni Kayıt Yapıldığında auth.users'dan profiles Tablosuna Otomatik Kayıt Atan Fonksiyon (Supabase Auth İçin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, phone_number, trust_score, reports_count, verified_count, badge)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
        NEW.raw_user_meta_data->>'phone_number',
        100,
        0,
        0,
        'Yeni Vatandaş'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supabase Auth Signup Sonrası Tetikleyici
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vatandaş Güven Skoru ve Rozet Otomatik Güncelleme Fonksiyonu
CREATE OR REPLACE FUNCTION public.update_profile_badge_and_score()
RETURNS TRIGGER AS $$
DECLARE
    score_change INT := 0;
    new_score INT;
    new_badge VARCHAR(50);
BEGIN
    -- Yalnızca durum değiştiğinde çalışır
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        IF (NEW.status = 'Çözüldü') THEN
            score_change := 5;
        ELSIF (NEW.status = 'İptal') THEN
            score_change := -10;
        END IF;

        IF (score_change <> 0 AND NEW.citizen_id IS NOT NULL) THEN
            -- Profil güven skorunu ve doğrulanan ihbar sayısını güncelle
            UPDATE public.profiles
            SET trust_score = GREATEST(0, trust_score + score_change),
                verified_count = CASE WHEN score_change > 0 THEN verified_count + 1 ELSE verified_count END
            WHERE id = NEW.citizen_id
            RETURNING trust_score INTO new_score;

            -- Yeni skora göre rozeti belirle
            IF new_score >= 150 THEN
                new_badge := '🏅 Elit Vatandaş';
            ELSIF new_score >= 120 THEN
                new_badge := '🥈 Aktif Vatandaş';
            ELSIF new_score >= 90 THEN
                new_badge := '🥉 Güvenilir Vatandaş';
            ELSE
                new_badge := 'Yeni Vatandaş';
            END IF;

            -- Rozeti güncelle
            UPDATE public.profiles
            SET badge = new_badge
            WHERE id = NEW.citizen_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Güven Skoru Tetikleyicisi
DROP TRIGGER IF EXISTS trigger_update_citizen_trust_score ON public.reports;
CREATE TRIGGER trigger_update_citizen_trust_score
    AFTER UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profile_badge_and_score();

-- Vatandaş İhbar Sayısı Sayacı Tetikleyicisi
CREATE OR REPLACE FUNCTION public.increment_citizen_reports_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.citizen_id IS NOT NULL THEN
        UPDATE public.profiles
        SET reports_count = reports_count + 1
        WHERE id = NEW.citizen_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_reports_count ON public.reports;
CREATE TRIGGER trigger_increment_reports_count
    AFTER INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_citizen_reports_count();

-- ----------------------------------------------------
-- Performans Endeksleri (Indexes)
-- ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON public.reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_coords ON public.reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
