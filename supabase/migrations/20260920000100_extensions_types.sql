-- Ministry Report: extensions, private schema, enum types.
create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create type public.member_role        as enum ('publisher', 'ministerial_servant', 'elder'); -- order matters (>=)
create type public.member_status      as enum ('pending', 'active', 'inactive', 'rejected', 'anonymized');
create type public.app_lang           as enum ('en', 'sw');
create type public.report_category    as enum ('publisher', 'auxiliary_pioneer', 'regular_pioneer', 'special_pioneer');
create type public.report_status      as enum ('submitted', 'reopened', 'not_reported');
create type public.arrangement_status as enum ('pending', 'approved', 'rejected', 'ended');
