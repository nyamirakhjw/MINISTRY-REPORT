-- Development seed. Contains NO personal data and NO invented meeting times or addresses:
-- the landing page hides those blocks until an Elder or the Owner fills them in (see docs/SETUP.md).
insert into public.congregations (slug, name, tagline)
values ('nyamira', 'Nyamira Kingdom Hall of Jehovah''s Witnesses', 'A people for Jehovah''s Name')
on conflict (slug) do nothing;

insert into public.groups (congregation_id, name)
select c.id, g.name from public.congregations c, (values ('Nyamira Town'), ('Miruka Town')) as g(name)
where c.slug = 'nyamira'
on conflict (congregation_id, name) do nothing;
