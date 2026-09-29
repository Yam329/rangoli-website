-- Coupons managed from the admin dashboard.
-- Run once in the Supabase SQL editor BEFORE deploying the new code.

create table if not exists public.coupons (
  id              bigint generated always as identity primary key,
  code            text        not null unique,
  title           text        not null default '',
  description     text        not null default '',

  -- fixed_price : participant pays exactly discount_value (e.g. 699)
  -- flat        : discount_value rupees off the registration fee
  -- percent     : discount_value percent off the registration fee
  discount_type   text        not null default 'fixed_price'
                  check (discount_type in ('fixed_price', 'flat', 'percent')),
  discount_value  numeric     not null check (discount_value > 0),

  is_active       boolean     not null default true,
  valid_from      timestamptz,
  valid_until     timestamptz,

  -- null = unlimited. Counts registrations that used the coupon.
  max_uses        integer     check (max_uses is null or max_uses > 0),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint coupons_code_upper check (code = upper(code))
);

-- Keep the two coupons that were previously hard-coded.
insert into public.coupons (code, title, description, discount_type, discount_value)
values
  ('UDAYBHANU0246', 'Uday Bhanu Offer',   'Special registration offer',                    'fixed_price', 699),
  ('GTST0246',      'GTST Student Offer', 'Special offer for students registered in GTST', 'fixed_price', 599)
on conflict (code) do nothing;
