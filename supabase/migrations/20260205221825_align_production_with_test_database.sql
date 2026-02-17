-- Add admin_users table (from test database)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role = ANY (ARRAY['admin'::text, 'owner'::text])),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  invited_by UUID REFERENCES public.admin_users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add magic_link_tokens table (from test database)
CREATE TABLE IF NOT EXISTS public.magic_link_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  guest_id UUID NOT NULL REFERENCES public.guests(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add guest_sessions table (from test database)
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES public.guests(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add email_history table (from test database)
CREATE TABLE IF NOT EXISTS public.email_history (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  template_id UUID REFERENCES public.email_templates(id),
  recipient_ids UUID[],
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status = ANY (ARRAY['pending'::text, 'sent'::text, 'delivered'::text, 'failed'::text, 'bounced'::text])),
  sent_by UUID REFERENCES public.admin_users(id),
  error_message TEXT,
  webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add sections.title column (from test database)
ALTER TABLE public.sections 
ADD COLUMN IF NOT EXISTS title TEXT;

COMMENT ON COLUMN public.sections.title IS 'Optional title for the section, displayed above the content';

-- Add vendor_bookings enhanced columns (from test database)
ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS guest_count INTEGER CHECK (guest_count IS NULL OR guest_count >= 0);

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'flat_rate' CHECK (pricing_model = ANY (ARRAY['flat_rate'::text, 'per_guest'::text]));

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0 CHECK (total_cost >= 0);

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS host_subsidy NUMERIC DEFAULT 0;

ALTER TABLE public.vendor_bookings 
ADD COLUMN IF NOT EXISTS base_cost NUMERIC;

COMMENT ON COLUMN public.vendor_bookings.guest_count IS 'Number of guests for per-guest pricing model';
COMMENT ON COLUMN public.vendor_bookings.pricing_model IS 'flat_rate: fixed cost, per_guest: cost per attendee';
COMMENT ON COLUMN public.vendor_bookings.total_cost IS 'Total cost for this vendor booking';
COMMENT ON COLUMN public.vendor_bookings.host_subsidy IS 'Amount host will subsidize for this booking';;
