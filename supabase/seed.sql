-- Local development users. Password for every account: sharedliving123
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000001','authenticated','authenticated','napat@gmail.com',crypt('12345678',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"display_name":"Napat W."}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000002','authenticated','authenticated','ploy@gmail.com',crypt('12345678',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"display_name":"Ploy S."}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000003','authenticated','authenticated','kevin@gmail.com',crypt('12345678',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"display_name":"Kevin L."}',now(),now(),'','','',''),
  ('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000004','authenticated','authenticated','mei@gmail.com',crypt('12345678',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"display_name":"Mei T."}',now(),now(),'','','','')
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id, id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where id in (
  '10000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000004'
) on conflict (provider_id, provider) do nothing;

insert into public.houses (id, name, invite_code, currency, harmony_score, created_by, created_at)
values ('20000000-0000-0000-0000-000000000001','Sunrise House 402','SUNRISE402','THB',82,'10000000-0000-0000-0000-000000000001',now() - interval '6 months')
on conflict (id) do nothing;

insert into public.house_members (house_id, user_id, role, joined_at) values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','owner',now() - interval '6 months'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','member',now() - interval '5 months'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000003','member',now() - interval '5 months'),
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000004','member',now() - interval '4 months')
on conflict do nothing;

insert into public.expenses (id, house_id, title, description, category, amount, paid_by, expense_date, created_by) values
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Electricity bill — September','Monthly electricity bill','electricity',2480,'10000000-0000-0000-0000-000000000001',current_date - 3,'10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Weekly groceries','Fresh food and household essentials','grocery',1860,'10000000-0000-0000-0000-000000000002',current_date - 2,'10000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Fiber internet','September internet','internet',899,'10000000-0000-0000-0000-000000000003',current_date - 7,'10000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','September rent','Monthly house rent','rent',18000,'10000000-0000-0000-0000-000000000001',date_trunc('month',current_date)::date,'10000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.expense_splits (expense_id,user_id,amount,is_paid,paid_at)
select e.id, m.user_id, round(e.amount / 4, 2), m.user_id = e.paid_by, case when m.user_id = e.paid_by then now() else null end
from public.expenses e join public.house_members m on m.house_id = e.house_id
where e.house_id = '20000000-0000-0000-0000-000000000001'
on conflict (expense_id,user_id) do nothing;

insert into public.tasks (id,house_id,title,description,due_at,assignment_type,assigned_to,status,completion_photo_path,completed_at,created_by) values
  ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Kitchen deep clean','Counters, sink, stove top and recycling.',date_trunc('day',now()) + interval '18 hours','rotation','10000000-0000-0000-0000-000000000002','pending',null,null,'10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Take out the trash','All bins, including the balcony bin.',date_trunc('day',now()) + interval '20 hours','rotation','10000000-0000-0000-0000-000000000003','pending',null,null,'10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Water the plants','Water indoor plants and the balcony herbs.',now() - interval '1 hour','manual','10000000-0000-0000-0000-000000000001','completed','20000000-0000-0000-0000-000000000001/demo/water-plants.webp',now() - interval '45 minutes','10000000-0000-0000-0000-000000000001'),
  ('40000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000001','Bathroom scrub','Shower glass, mirror and floor.',now() + interval '1 day','random','10000000-0000-0000-0000-000000000004','pending',null,null,'10000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;

insert into public.harmony_events (id,house_id,user_id,task_id,points,reason,created_at) values
  ('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000003',0,'seed_baseline',now() - interval '45 minutes')
on conflict (id) do nothing;

insert into public.celebrations (id,house_id,title,details,location,starts_at,created_by) values
  ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Movie night','Pick a movie together and bring your favourite snack.','Living room',date_trunc('day',now()) + interval '1 day 19 hours 30 minutes','10000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.notifications (id,user_id,house_id,type,title,body,href,created_at) values
  ('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','task','Kitchen deep clean is due today','Ploy has a task due at 6:00 PM.','/chores/40000000-0000-0000-0000-000000000001',now() - interval '10 minutes'),
  ('70000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','expense','Ploy added a shared expense','Weekly groceries · ฿1,860','/expenses/30000000-0000-0000-0000-000000000002',now() - interval '1 hour'),
  ('70000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','harmony','Your house reached Harmony Home','Level 5 is ready to celebrate.','/harmony',now() - interval '1 day')
on conflict (id) do nothing;
