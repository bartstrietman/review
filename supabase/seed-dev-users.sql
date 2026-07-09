-- Dev-only seed: two password users so we can log in without real OTP email.
-- Run against the dev project ONLY (never production). Idempotent.
-- admin@reviewupgrade.test  / devpass1234   (app_metadata.role = 'admin')
-- klant@reviewupgrade.test  / devpass1234   (regular user)
--
-- NOTE: GoTrue (Go) cannot scan NULL into its string token columns, so they
-- must be set to '' — otherwise password login fails with
-- "Database error querying schema".

do $$
declare
  v_admin uuid;
  v_klant uuid;
begin
  delete from auth.users where email in ('admin@reviewupgrade.test','klant@reviewupgrade.test');

  v_admin := gen_random_uuid();
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
                          raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
                          confirmation_token,recovery_token,email_change_token_new,email_change,
                          phone_change,phone_change_token,email_change_token_current,reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000',v_admin,'authenticated','authenticated',
          'admin@reviewupgrade.test',extensions.crypt('devpass1234',extensions.gen_salt('bf')),now(),
          '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
          '{"name":"Dev Admin"}'::jsonb,now(),now(),
          '','','','','','','','');
  insert into auth.identities (id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(), v_admin::text, v_admin,
          jsonb_build_object('sub',v_admin::text,'email','admin@reviewupgrade.test','email_verified',true),
          'email', now(), now(), now());

  v_klant := gen_random_uuid();
  insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
                          raw_app_meta_data,raw_user_meta_data,created_at,updated_at,
                          confirmation_token,recovery_token,email_change_token_new,email_change,
                          phone_change,phone_change_token,email_change_token_current,reauthentication_token)
  values ('00000000-0000-0000-0000-000000000000',v_klant,'authenticated','authenticated',
          'klant@reviewupgrade.test',extensions.crypt('devpass1234',extensions.gen_salt('bf')),now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          '{"name":"Dev Klant"}'::jsonb,now(),now(),
          '','','','','','','','');
  insert into auth.identities (id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
  values (gen_random_uuid(), v_klant::text, v_klant,
          jsonb_build_object('sub',v_klant::text,'email','klant@reviewupgrade.test','email_verified',true),
          'email', now(), now(), now());
end $$;
