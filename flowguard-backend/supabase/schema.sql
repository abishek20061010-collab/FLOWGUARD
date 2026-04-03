-- ============================================================
-- FlowGuard — Complete Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- TABLE: profiles
-- Stores user metadata linked 1:1 with auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         text        NOT NULL,
  phone_number      text        UNIQUE NOT NULL,
  role              text        NOT NULL DEFAULT 'citizen'
                                  CHECK (role IN ('citizen', 'admin', 'fisherman')),
  civic_coins       integer     NOT NULL DEFAULT 0,
  fcm_token         text,
  preferred_language text       NOT NULL DEFAULT 'en'
                                  CHECK (preferred_language IN ('en', 'ta')),
  created_at        timestamptz DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles linked to Supabase Auth users';


-- ============================================================
-- TABLE: zones
-- Geographic zones for Chennai region
-- ============================================================
CREATE TABLE IF NOT EXISTS public.zones (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  ward_number       text        NOT NULL,
  is_coastal        boolean     NOT NULL DEFAULT false,
  risk_level        text        NOT NULL DEFAULT 'normal'
                                  CHECK (risk_level IN ('normal', 'yellow', 'orange', 'red')),
  center_latitude   numeric     NOT NULL,
  center_longitude  numeric     NOT NULL,
  radius_km         numeric     NOT NULL DEFAULT 5,
  created_at        timestamptz DEFAULT now()
);

COMMENT ON TABLE public.zones IS 'Geofenced zones for Chennai urban/coastal areas';


-- ============================================================
-- TABLE: reports
-- Citizen-submitted infrastructure reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category            text        NOT NULL
                                    CHECK (category IN ('choked_drain', 'damaged_road', 'waterlogging', 'other')),
  description         text,
  latitude            numeric     NOT NULL,
  longitude           numeric     NOT NULL,
  photo_url           text        NOT NULL,
  status              text        NOT NULL DEFAULT 'reported'
                                    CHECK (status IN ('reported', 'assigned', 'in_progress', 'resolved')),
  severity            text        NOT NULL DEFAULT 'low'
                                    CHECK (severity IN ('low', 'medium', 'high')),
  blockage_type       text        NOT NULL DEFAULT 'unknown',
  assigned_to         uuid        REFERENCES public.profiles(id),
  resolution_photo_url text,
  location_name       text,
  zone_id             uuid        REFERENCES public.zones(id),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

COMMENT ON TABLE public.reports IS 'Civic infrastructure reports submitted by users';


-- ============================================================
-- TABLE: alerts
-- Disaster/weather alerts for zones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id        uuid        NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  alert_type     text        NOT NULL
                               CHECK (alert_type IN ('cyclone', 'flood', 'high_winds', 'storm_surge')),
  severity_level text        NOT NULL
                               CHECK (severity_level IN ('yellow', 'orange', 'red')),
  title          text        NOT NULL,
  message        text        NOT NULL,
  is_active      boolean     NOT NULL DEFAULT true,
  triggered_at   timestamptz DEFAULT now(),
  expires_at     timestamptz NOT NULL
);

COMMENT ON TABLE public.alerts IS 'Coastal disaster and weather alerts per zone';


-- ============================================================
-- TABLE: sos_events
-- Emergency SOS signals from users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sos_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude   numeric     NOT NULL,
  longitude  numeric     NOT NULL,
  status     text        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'acknowledged', 'resolved')),
  sms_sent   boolean     NOT NULL DEFAULT false,
  fcm_sent   boolean     NOT NULL DEFAULT false,
  notes      text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.sos_events IS 'Emergency SOS events triggered by users';


-- ============================================================
-- TABLE: notifications_log
-- Audit log for all sent notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_id uuid        REFERENCES public.alerts(id),
  channel  text        NOT NULL CHECK (channel IN ('fcm', 'sms')),
  status   text        NOT NULL CHECK (status IN ('sent', 'failed')),
  sent_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.notifications_log IS 'Audit log of FCM and SMS notifications';


-- ============================================================
-- TRIGGER: auto-update updated_at on reports
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reports_updated_at ON public.reports;
CREATE TRIGGER trigger_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_report_updated_at();


-- ============================================================
-- RPC: increment_civic_coins
-- Used to safely increment civic_coins bypassing RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_civic_coins(
  user_id_param uuid,
  amount        integer
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET civic_coins = civic_coins + amount
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- RPC: is_admin
-- Security definer function to avoid RLS infinite recursion
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS \$$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = ''admin''
  );
END;
\$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
-- Citizens: select and update own row only
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);


-- ============================================================
-- RLS POLICIES: zones
-- ============================================================
-- All authenticated users can read zones
CREATE POLICY "zones_select_authenticated"
  ON public.zones FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');

-- Only admins can create/modify/delete zones
CREATE POLICY "zones_admin_insert"
  ON public.zones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "zones_admin_update"
  ON public.zones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "zones_admin_delete"
  ON public.zones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- ============================================================
-- RLS POLICIES: reports
-- ============================================================
-- Citizens: insert and select own reports
CREATE POLICY "reports_insert_own"
  ON public.reports FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "reports_select_own"
  ON public.reports FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins: update all reports
CREATE POLICY "reports_admin_update"
  ON public.reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- ============================================================
-- RLS POLICIES: alerts
-- ============================================================
-- All authenticated users can view active alerts
CREATE POLICY "alerts_select_authenticated"
  ON public.alerts FOR SELECT
  USING ((SELECT auth.role()) = 'authenticated');

-- Only admins can create/modify/delete alerts
CREATE POLICY "alerts_admin_insert"
  ON public.alerts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "alerts_admin_update"
  ON public.alerts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "alerts_admin_delete"
  ON public.alerts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- ============================================================
-- RLS POLICIES: sos_events
-- ============================================================
-- Citizens: insert and select own events
CREATE POLICY "sos_insert_own"
  ON public.sos_events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "sos_select_own"
  ON public.sos_events FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins: update all SOS events
CREATE POLICY "sos_admin_update"
  ON public.sos_events FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));


-- ============================================================
-- RLS POLICIES: notifications_log
-- ============================================================
-- Only admins can read notification logs
CREATE POLICY "notifications_log_admin_select"
  ON public.notifications_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Backend service inserts (via service role key bypasses RLS)
CREATE POLICY "notifications_log_insert"
  ON public.notifications_log FOR INSERT
  WITH CHECK (true);


-- ============================================================
-- SEED DATA: 5 Chennai Region Zones
-- ============================================================
INSERT INTO public.zones (name, ward_number, is_coastal, risk_level, center_latitude, center_longitude, radius_km)
VALUES
  ('Besant Nagar',   '173', true,  'normal', 12.9990, 80.2707, 3),
  ('Marina Beach Zone', '131', true,  'normal', 13.0500, 80.2824, 4),
  ('Tambaram',       '001', false, 'normal', 12.9249, 80.1000, 5),
  ('Velachery',      '174', false, 'normal', 12.9815, 80.2180, 4),
  ('Adyar',          '172', true,  'normal', 13.0012, 80.2565, 3)
ON CONFLICT DO NOTHING;
