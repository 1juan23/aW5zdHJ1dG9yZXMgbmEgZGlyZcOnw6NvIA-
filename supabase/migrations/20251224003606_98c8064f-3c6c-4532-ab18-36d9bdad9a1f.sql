-- Drop and recreate the instructors_public view to include plan information
DROP VIEW IF EXISTS public.instructors_public;

CREATE VIEW public.instructors_public AS
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
    CASE 
        WHEN i.status = 'approved' THEN true
        ELSE false 
    END as is_verified,
    COALESCE(s.plan_type, 'trial') as plan_type,
    CASE 
        WHEN s.plan_type = 'elite' THEN 1
        WHEN s.plan_type = 'destaque' THEN 2
        WHEN s.plan_type = 'essencial' THEN 3
        ELSE 4
    END as plan_priority
FROM public.instructors i
LEFT JOIN public.instructor_subscriptions s ON i.id = s.instructor_id
WHERE i.status = 'approved';