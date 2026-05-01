REVOKE EXECUTE ON FUNCTION public.apply_template_to_listing(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_template_to_listing(UUID, UUID) TO authenticated;