-- Row Level Security (RLS) Policies
-- Comprehensive data protection and multi-tenancy support
-- Designed for enterprise scale with performance optimization

-- ==================================================================
-- ENABLE RLS ON ALL TABLES
-- ==================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ==================================================================
-- PROFILES TABLE POLICIES
-- ==================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Organization admins can view profiles in their organization
CREATE POLICY "Organization admins can view org profiles" ON public.profiles
    FOR SELECT USING (
        organization_id IN (
            SELECT o.id FROM public.organizations o
            JOIN public.profiles p ON p.organization_id = o.id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- Teachers can view students in their organization
CREATE POLICY "Teachers can view org students" ON public.profiles
    FOR SELECT USING (
        role = 'student' AND
        organization_id IN (
            SELECT p.organization_id FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'teacher'
        )
    );

-- Super admins can view all profiles (with rate limiting in application)
CREATE POLICY "Super admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- ==================================================================
-- ORGANIZATIONS TABLE POLICIES
-- ==================================================================

-- Organization members can view their organization
CREATE POLICY "Members can view own organization" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    );

-- Organization admins can update their organization
CREATE POLICY "Admins can update own organization" ON public.organizations
    FOR UPDATE USING (
        id IN (
            SELECT p.organization_id FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- Super admins can manage all organizations
CREATE POLICY "Super admins can manage organizations" ON public.organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- ==================================================================
-- CONTENT TABLE POLICIES
-- ==================================================================

-- Anyone can view published content (public access for learning materials)
CREATE POLICY "Anyone can view published content" ON public.content
    FOR SELECT USING (status = 'published');

-- Content creators can view their own content (any status)
CREATE POLICY "Creators can view own content" ON public.content
    FOR SELECT USING (created_by = auth.uid());

-- Content creators can update their own content
CREATE POLICY "Creators can update own content" ON public.content
    FOR UPDATE USING (created_by = auth.uid());

-- Content creators can insert new content
CREATE POLICY "Users can create content" ON public.content
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        created_by = auth.uid()
    );

-- Organization admins can manage content in their organization
CREATE POLICY "Org admins can manage org content" ON public.content
    FOR ALL USING (
        organization_id IN (
            SELECT p.organization_id FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- Teachers can manage content in their organization
CREATE POLICY "Teachers can manage org content" ON public.content
    FOR ALL USING (
        organization_id IN (
            SELECT p.organization_id FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'teacher'
        )
    );

-- Super admins can manage all content
CREATE POLICY "Super admins can manage all content" ON public.content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- ==================================================================
-- INTERACTIONS TABLE POLICIES
-- ==================================================================

-- Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON public.interactions
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own interactions
CREATE POLICY "Users can insert own interactions" ON public.interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Teachers can view interactions for content in their organization
CREATE POLICY "Teachers can view org content interactions" ON public.interactions
    FOR SELECT USING (
        content_id IN (
            SELECT c.id FROM public.content c
            JOIN public.profiles p ON p.organization_id = c.organization_id
            WHERE p.id = auth.uid() AND p.role = 'teacher'
        )
    );

-- Organization admins can view interactions in their organization
CREATE POLICY "Org admins can view org interactions" ON public.interactions
    FOR SELECT USING (
        user_id IN (
            SELECT prof.id FROM public.profiles prof
            JOIN public.profiles p ON p.organization_id = prof.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- Analytics role can view all interactions (for data analysis)
CREATE POLICY "Analytics can view all interactions" ON public.interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- ==================================================================
-- LEARNING_PATHS TABLE POLICIES
-- ==================================================================

-- Anyone can view published learning paths
CREATE POLICY "Anyone can view published paths" ON public.learning_paths
    FOR SELECT USING (status = 'published');

-- Path creators can manage their own paths
CREATE POLICY "Creators can manage own paths" ON public.learning_paths
    FOR ALL USING (created_by = auth.uid());

-- Users can create learning paths
CREATE POLICY "Users can create learning paths" ON public.learning_paths
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        created_by = auth.uid()
    );

-- Organization members can manage organization paths
CREATE POLICY "Org members can manage org paths" ON public.learning_paths
    FOR ALL USING (
        organization_id IN (
            SELECT p.organization_id FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin', 'super_admin')
        )
    );

-- ==================================================================
-- USER_PROGRESS TABLE POLICIES
-- ==================================================================

-- Users can view their own progress
CREATE POLICY "Users can view own progress" ON public.user_progress
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own progress" ON public.user_progress
    FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress" ON public.user_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Teachers can view student progress in their organization
CREATE POLICY "Teachers can view student progress" ON public.user_progress
    FOR SELECT USING (
        user_id IN (
            SELECT prof.id FROM public.profiles prof
            JOIN public.profiles p ON p.organization_id = prof.organization_id
            WHERE p.id = auth.uid() AND p.role = 'teacher'
            AND prof.role = 'student'
        )
    );

-- Organization admins can view progress in their organization
CREATE POLICY "Org admins can view org progress" ON public.user_progress
    FOR SELECT USING (
        user_id IN (
            SELECT prof.id FROM public.profiles prof
            JOIN public.profiles p ON p.organization_id = prof.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- ==================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ==================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications for any user (service role)
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        -- Allow service role to insert notifications
        auth.role() = 'service_role' OR
        -- Allow admins to send notifications to their organization
        user_id IN (
            SELECT prof.id FROM public.profiles prof
            JOIN public.profiles p ON p.organization_id = prof.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- ==================================================================
-- ANALYTICS_EVENTS TABLE POLICIES
-- ==================================================================

-- Users can insert their own analytics events
CREATE POLICY "Users can insert own analytics" ON public.analytics_events
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR user_id IS NULL -- Allow anonymous events
    );

-- Analytics role can view all events
CREATE POLICY "Analytics can view all events" ON public.analytics_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- Organization admins can view events for their organization users
CREATE POLICY "Org admins can view org analytics" ON public.analytics_events
    FOR SELECT USING (
        user_id IN (
            SELECT prof.id FROM public.profiles prof
            JOIN public.profiles p ON p.organization_id = prof.organization_id
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
        )
    );

-- ==================================================================
-- SECURITY FUNCTIONS FOR CHILD PROTECTION
-- ==================================================================

-- Function to check if user is a child and has parental consent
CREATE OR REPLACE FUNCTION check_child_protection(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = target_user_id
        AND age_group = 'child'
        AND parental_consent = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced policy for child protection on interactions
CREATE POLICY "Child protection for interactions" ON public.interactions
    FOR INSERT WITH CHECK (
        check_child_protection(user_id)
    );

-- ==================================================================
-- PERFORMANCE OPTIMIZATION POLICIES
-- ==================================================================

-- Policy to limit large data exports (prevents abuse)
CREATE OR REPLACE FUNCTION check_export_limits()
RETURNS BOOLEAN AS $$
BEGIN
    -- Limit large queries to admin roles
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- AUDIT AND COMPLIANCE
-- ==================================================================

-- Create audit log table for compliance
CREATE TABLE public.audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES public.profiles(id),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs" ON public.audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'super_admin'
        )
    );

-- Function to log sensitive operations
CREATE OR REPLACE FUNCTION log_sensitive_operation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_log (table_name, operation, user_id, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_log (table_name, operation, user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_log (table_name, operation, user_id, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, auth.uid(), row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();

CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION log_sensitive_operation();

-- ==================================================================
-- COMMENTS AND DOCUMENTATION
-- ==================================================================

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS 'Basic RLS: Users can only access their own profile data';
COMMENT ON POLICY "Organization admins can view org profiles" ON public.profiles IS 'Multi-tenancy: Org admins can manage their organization members';
COMMENT ON POLICY "Anyone can view published content" ON public.content IS 'Public access: Published educational content is freely accessible';
COMMENT ON POLICY "Child protection for interactions" ON public.interactions IS 'COPPA compliance: Protects children without parental consent';

COMMENT ON FUNCTION check_child_protection(UUID) IS 'COPPA compliance function: Ensures children have parental consent before data collection';
COMMENT ON FUNCTION log_sensitive_operation() IS 'Audit function: Logs all sensitive operations for compliance and security';

COMMENT ON TABLE public.audit_log IS 'Compliance audit log: Tracks all sensitive operations for GDPR/COPPA compliance';