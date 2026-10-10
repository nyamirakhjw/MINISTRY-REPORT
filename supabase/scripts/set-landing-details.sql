-- Fill the public landing details (D-40). Edit the values, then run in the SQL editor.
-- Blocks left empty are simply not shown. Do not invent values: use the real ones.
update public.congregations
   set settings = jsonb_set(settings, '{landing}', jsonb_build_object(
     'midweek', jsonb_build_object('day', 'REPLACE', 'time', 'REPLACE'),
     'weekend', jsonb_build_object('day', 'REPLACE', 'time', 'REPLACE'),
     'address_lines', jsonb_build_array('REPLACE'),
     'map_url', 'REPLACE'))
 where slug = 'nyamira';
