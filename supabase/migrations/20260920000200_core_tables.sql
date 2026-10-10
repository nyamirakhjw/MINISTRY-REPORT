-- Core tables. Every congregation-scoped table carries congregation_id (multi-congregation from day one, D-01).
create table public.congregations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null check (char_length(name) between 2 and 120),
  tagline     text,
  timezone    text not null default 'Africa/Nairobi',
  settings    jsonb not null default '{
    "goals": {"regular_pioneer": 50, "special_pioneer": 70, "auxiliary_options": [15, 30]},
    "on_time_day": 10,
    "late_window_months": 1,
    "carry_over_default": true,
    "landing": {}
  }'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.groups (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations(id) on delete cascade,
  name             text not null check (char_length(name) between 2 and 80),
  retired          boolean not null default false,
  unique (congregation_id, name)
);

create table public.members (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid unique references auth.users(id) on delete set null, -- null = managed profile (D-10)
  congregation_id      uuid not null references public.congregations(id),
  group_id             uuid references public.groups(id),
  full_name            text not null check (char_length(full_name) between 2 and 120),
  username             extensions.citext unique check (username::text ~ '^[a-z0-9._-]{3,24}$'),
  email                extensions.citext,
  phone                text check (phone ~ '^\+?[0-9]{9,15}$'),
  role                 public.member_role   not null default 'publisher',
  status               public.member_status not null default 'pending',
  language             public.app_lang      not null default 'en',
  avatar_path          text,
  photo_note           text,
  rejection_note       text,
  first_report_month   date check (first_report_month = date_trunc('month', first_report_month)::date),
  inactive_from_month  date check (inactive_from_month = date_trunc('month', inactive_from_month)::date),
  approved_by          uuid references public.members(id),
  approved_at          timestamptz,
  created_at           timestamptz not null default now(),
  check (user_id is not null or role = 'publisher'),
  check (status <> 'active' or first_report_month is not null)
);
create index members_cong_status_idx on public.members (congregation_id, status);
create unique index members_email_uidx on public.members (email) where email is not null;

create table public.service_arrangements (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations(id),
  member_id        uuid not null references public.members(id),
  kind             public.report_category not null check (kind <> 'publisher'),
  start_month      date not null check (start_month = date_trunc('month', start_month)::date),
  end_month        date check (end_month = date_trunc('month', end_month)::date),
  aux_goal_hours   smallint check (aux_goal_hours in (15, 30)),
  status           public.arrangement_status not null default 'pending',
  requested_at     timestamptz not null default now(),
  decided_by       uuid references public.members(id),
  decided_at       timestamptz,
  decision_note    text,
  check (end_month is null or end_month >= start_month),
  check ((kind = 'auxiliary_pioneer') = (aux_goal_hours is not null))
);
create index arrangements_member_idx on public.service_arrangements (member_id);
create index arrangements_cong_status_idx on public.service_arrangements (congregation_id, status);

create table public.member_goals (
  member_id   uuid not null references public.members(id) on delete cascade,
  month       date not null check (month = date_trunc('month', month)::date),
  goal_hours  smallint not null check (goal_hours between 1 and 744),
  primary key (member_id, month)
);

create table public.reports (
  id                   uuid primary key default gen_random_uuid(),
  congregation_id      uuid not null references public.congregations(id),
  member_id            uuid not null references public.members(id),
  month                date not null check (month = date_trunc('month', month)::date),
  status               public.report_status not null default 'submitted',
  category             public.report_category,
  participated         boolean,
  hours                smallint check (hours between 0 and 744),
  studies              smallint check (studies between 0 and 99),
  comment              text check (comment is null or
                         (char_length(comment) <= 600 and
                          array_length(regexp_split_to_array(btrim(comment), '\s+'), 1) <= 50)),
  goal_hours           smallint,
  carryover_seconds    integer not null default 0 check (carryover_seconds between 0 and 3599),
  submitted_via        text not null default 'self' check (submitted_via in ('self', 'elder')),
  submitted_by         uuid references public.members(id),
  received_at          timestamptz,
  client_submitted_at  timestamptz,
  server_received_at   timestamptz not null default now(),
  time_adjusted        boolean not null default false,
  is_late              boolean not null default false,
  request_id           uuid unique,
  version              integer not null default 1,
  unique (member_id, month),
  constraint publisher_no_locks check (
    category is distinct from 'publisher'::public.report_category
    or participated is distinct from false
    or (coalesce(studies, 0) = 0 and hours is null and comment is null)),
  constraint status_shape check (
    (status = 'not_reported' and category is null and participated is null
       and hours is null and studies is null and comment is null)
    or (status <> 'not_reported' and category is not null and studies is not null and (
          (category = 'publisher' and participated is not null and hours is null)
       or (category <> 'publisher' and hours is not null)))
  )
);
create index reports_cong_month_idx on public.reports (congregation_id, month);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  kind        text not null,
  payload     jsonb not null default '{}'::jsonb,
  dedupe_key  text not null unique,
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index notifications_member_idx on public.notifications (member_id, created_at desc);

create table public.notification_deliveries (
  id               bigint generated always as identity primary key,
  notification_id  uuid not null references public.notifications(id) on delete cascade,
  channel          text not null check (channel in ('push', 'email')),
  status           text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  send_after       timestamptz not null default now(),
  attempts         smallint not null default 0,
  last_error       text,
  sent_at          timestamptz
);
create index deliveries_due_idx on public.notification_deliveries (status, send_after);

create table public.consents (
  member_id    uuid not null references public.members(id) on delete cascade,
  document     text not null check (document in ('privacy', 'terms')),
  version      text not null,
  accepted_at  timestamptz not null default now(),
  primary key (member_id, document, version)
);

create table public.audit_log (
  id               bigint generated always as identity primary key,
  at               timestamptz not null default now(),
  congregation_id  uuid,
  actor_member_id  uuid,
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  before           jsonb,
  after            jsonb,
  reason           text
);
create index audit_cong_at_idx on public.audit_log (congregation_id, at desc);

create table public.platform_admins (user_id uuid primary key references auth.users(id) on delete cascade);

create table public.auth_attempts (
  id               bigint generated always as identity primary key,
  kind             text not null default 'signin' check (kind in ('signin', 'signup', 'recovery_code')),
  identifier_hash  text not null,
  ip_hash          text not null,
  at               timestamptz not null default now(),
  success          boolean not null
);
create index auth_attempts_ident_idx on public.auth_attempts (kind, identifier_hash, at desc);
create index auth_attempts_ip_idx on public.auth_attempts (kind, ip_hash, at desc);

create table public.recovery_codes (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  code_hash   text not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index recovery_codes_member_idx on public.recovery_codes (member_id) where used_at is null;

create table public.profile_change_requests (
  id               uuid primary key default gen_random_uuid(),
  congregation_id  uuid not null references public.congregations(id),
  member_id        uuid not null references public.members(id) on delete cascade,
  kind             text not null check (kind in ('full_name', 'username')),
  new_value        text not null check (char_length(new_value) between 2 and 120),
  status           text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  decided_by       uuid references public.members(id),
  decided_at       timestamptz,
  decision_note    text,
  created_at       timestamptz not null default now()
);
create unique index one_pending_change on public.profile_change_requests (member_id, kind) where status = 'pending';
