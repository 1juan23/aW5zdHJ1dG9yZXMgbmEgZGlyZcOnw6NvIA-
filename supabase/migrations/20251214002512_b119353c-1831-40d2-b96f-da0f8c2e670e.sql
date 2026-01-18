-- Adicionar role admin ao usuário juan.h.silva2000@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'juan.h.silva2000@gmail.com'
ON CONFLICT DO NOTHING;