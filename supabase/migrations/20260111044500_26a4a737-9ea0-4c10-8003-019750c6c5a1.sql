
-- Atualizar a view instructors_public para considerar paused_at
-- Instrutores pausados não devem ter selo nem aparecer no topo

CREATE OR REPLACE VIEW public.instructors_public AS
SELECT 
    i.id,
    i.user_id,
    i.name,
    i.city,
    i.state,
    i.neighborhoods,
    i.bio,
    i.experience,
    i.specialties,
    i.price,
    i.rating,
    i.total_reviews,
    i.avatar_url,
    i.status,
    i.created_at,
    i.updated_at,
    -- Se pausado, mostra como trial
    CASE
        WHEN s.paused_at IS NOT NULL THEN 'paused'
        ELSE COALESCE(s.plan_type, 'trial')
    END AS plan_type,
    -- Se pausado, vai para o final do ranking
    CASE
        WHEN s.paused_at IS NOT NULL THEN 100
        WHEN COALESCE(s.plan_type, 'trial') = 'elite' THEN 1
        WHEN COALESCE(s.plan_type, 'trial') = 'destaque' THEN 2
        WHEN COALESCE(s.plan_type, 'trial') = 'essencial' THEN 3
        ELSE 4
    END AS plan_priority,
    -- Se pausado, perde o selo de verificado
    CASE
        WHEN s.paused_at IS NOT NULL THEN false
        WHEN COALESCE(s.plan_type, 'trial') IN ('destaque', 'elite') THEN true
        ELSE false
    END AS is_verified
FROM instructors i
LEFT JOIN instructor_subscriptions s ON s.instructor_id = i.id
WHERE i.status = 'approved';
