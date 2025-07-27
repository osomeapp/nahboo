-- Learning Paths Database Migration
-- Tables for personalized learning path system with progress tracking and adaptation

-- Learning Paths Table (main path definitions)
CREATE TABLE IF NOT EXISTS public.learning_paths (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_completion_time INTEGER DEFAULT 0, -- in minutes
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_node TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
    path_data JSONB NOT NULL DEFAULT '{}', -- stores nodes, objectives, and adaptation history
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- Learning Path Progress Table (tracks user progress through paths)
CREATE TABLE IF NOT EXISTS public.learning_path_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    progress_type TEXT NOT NULL CHECK (progress_type IN ('content_completed', 'objective_mastered', 'milestone_reached', 'skill_acquired')),
    progress_data JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    INDEX (path_id, user_id, timestamp)
);

-- Learning Path Adaptations Table (tracks adaptive changes)
CREATE TABLE IF NOT EXISTS public.learning_path_adaptations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    adaptation_trigger TEXT NOT NULL CHECK (adaptation_trigger IN ('performance_change', 'user_request', 'scheduled_review', 'content_completion')),
    adaptation_type TEXT NOT NULL CHECK (adaptation_type IN ('difficulty_adjustment', 'content_preference', 'pace_modification', 'remediation_added')),
    previous_state JSONB,
    new_state JSONB,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    adaptations_applied TEXT[],
    performance_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Objectives Table (reusable learning objectives)
CREATE TABLE IF NOT EXISTS public.learning_objectives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_time INTEGER DEFAULT 0, -- in minutes
    prerequisites TEXT[] DEFAULT '{}',
    skills_gained TEXT[] DEFAULT '{}',
    content_types TEXT[] DEFAULT '{}',
    learning_outcomes TEXT[] DEFAULT '{}',
    assessment_criteria JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Objectives Mapping (links content to objectives)
CREATE TABLE IF NOT EXISTS public.content_objectives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id TEXT NOT NULL,
    objective_id TEXT REFERENCES public.learning_objectives(id) ON DELETE CASCADE,
    relevance_score DECIMAL(3,2) DEFAULT 0.5,
    prerequisite_for TEXT[],
    supports_skills TEXT[],
    difficulty_match_score DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id, objective_id)
);

-- User Learning Profiles Table (comprehensive learning analytics)
CREATE TABLE IF NOT EXISTS public.user_learning_profiles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    subject_strengths JSONB DEFAULT '{}', -- subject -> proficiency score
    learning_velocity DECIMAL(5,2) DEFAULT 2.0, -- items per hour
    preferred_content_types JSONB DEFAULT '{}', -- content_type -> preference score
    difficulty_comfort_zone TEXT DEFAULT 'beginner' CHECK (difficulty_comfort_zone IN ('beginner', 'intermediate', 'advanced')),
    engagement_patterns JSONB DEFAULT '{}', -- session length, optimal times, attention span
    knowledge_gaps TEXT[] DEFAULT '{}',
    mastered_skills TEXT[] DEFAULT '{}',
    learning_style TEXT DEFAULT 'mixed' CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'mixed')),
    last_assessment_date TIMESTAMPTZ,
    profile_confidence DECIMAL(3,2) DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Path Recommendations Table (stores AI-generated recommendations)
CREATE TABLE IF NOT EXISTS public.learning_path_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.5,
    personalization_factors TEXT[] DEFAULT '{}',
    generated_by TEXT DEFAULT 'ai_engine',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Learning Milestones Table (tracks achievements and milestones)
CREATE TABLE IF NOT EXISTS public.learning_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    path_id TEXT REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    milestone_type TEXT NOT NULL CHECK (milestone_type IN ('progress_milestone', 'skill_mastery', 'objective_completion', 'path_completion', 'streak_achievement')),
    title TEXT NOT NULL,
    description TEXT,
    achievement_data JSONB DEFAULT '{}',
    points_awarded INTEGER DEFAULT 0,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    INDEX (user_id, achieved_at)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_status ON public.learning_paths(user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_subject ON public.learning_paths(subject);
CREATE INDEX IF NOT EXISTS idx_learning_paths_difficulty ON public.learning_paths(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_path_progress_user_path ON public.learning_path_progress(user_id, path_id);
CREATE INDEX IF NOT EXISTS idx_path_progress_timestamp ON public.learning_path_progress(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_path_progress_type ON public.learning_path_progress(progress_type);

CREATE INDEX IF NOT EXISTS idx_path_adaptations_user_path ON public.learning_path_adaptations(user_id, path_id);
CREATE INDEX IF NOT EXISTS idx_path_adaptations_trigger ON public.learning_path_adaptations(adaptation_trigger);
CREATE INDEX IF NOT EXISTS idx_path_adaptations_timestamp ON public.learning_path_adaptations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_objectives_subject ON public.learning_objectives(subject);
CREATE INDEX IF NOT EXISTS idx_learning_objectives_difficulty ON public.learning_objectives(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_content_objectives_content ON public.content_objectives(content_id);
CREATE INDEX IF NOT EXISTS idx_content_objectives_objective ON public.content_objectives(objective_id);
CREATE INDEX IF NOT EXISTS idx_content_objectives_relevance ON public.content_objectives(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_updated ON public.user_learning_profiles(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_confidence ON public.user_learning_profiles(profile_confidence DESC);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_status ON public.learning_path_recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_expires ON public.learning_path_recommendations(expires_at);
CREATE INDEX IF NOT EXISTS idx_recommendations_confidence ON public.learning_path_recommendations(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_milestones_user_type ON public.learning_milestones(user_id, milestone_type);
CREATE INDEX IF NOT EXISTS idx_milestones_path ON public.learning_milestones(path_id);
CREATE INDEX IF NOT EXISTS idx_milestones_achieved ON public.learning_milestones(achieved_at DESC);

-- Function to calculate learning path progress
CREATE OR REPLACE FUNCTION calculate_path_progress(target_path_id TEXT, target_user_id UUID)
RETURNS TABLE (
    overall_percentage INTEGER,
    completed_nodes INTEGER,
    total_nodes INTEGER,
    current_node TEXT,
    estimated_completion_date TIMESTAMPTZ
) AS $$
DECLARE
    path_data JSONB;
    nodes_count INTEGER;
    completed_count INTEGER;
    progress_pct INTEGER;
    current_node_id TEXT;
    avg_velocity DECIMAL;
    remaining_time INTEGER;
BEGIN
    -- Get path data
    SELECT lp.path_data, lp.current_node 
    INTO path_data, current_node_id
    FROM public.learning_paths lp 
    WHERE lp.id = target_path_id AND lp.user_id = target_user_id;
    
    IF path_data IS NULL THEN
        RETURN;
    END IF;
    
    -- Count total nodes
    nodes_count := jsonb_array_length(path_data->'nodes');
    
    -- Count completed nodes by checking progress entries
    SELECT COUNT(DISTINCT node_id)
    INTO completed_count
    FROM public.learning_path_progress
    WHERE path_id = target_path_id 
    AND user_id = target_user_id 
    AND progress_type IN ('objective_mastered', 'milestone_reached');
    
    -- Calculate percentage
    progress_pct := CASE 
        WHEN nodes_count > 0 THEN (completed_count * 100) / nodes_count 
        ELSE 0 
    END;
    
    -- Get learning velocity
    SELECT COALESCE(learning_velocity, 2.0)
    INTO avg_velocity
    FROM public.user_learning_profiles
    WHERE user_id = target_user_id;
    
    -- Estimate completion (simplified)
    remaining_time := (nodes_count - completed_count) * 120; -- 2 hours per node average
    
    RETURN QUERY SELECT 
        progress_pct,
        completed_count,
        nodes_count,
        current_node_id,
        (NOW() + (remaining_time || ' minutes')::INTERVAL)::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql;

-- Function to update user learning profile
CREATE OR REPLACE FUNCTION update_user_learning_profile(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    engagement_data RECORD;
    performance_data RECORD;
    content_prefs JSONB := '{}';
    subject_strengths JSONB := '{}';
    velocity DECIMAL := 2.0;
BEGIN
    -- Get recent engagement metrics
    SELECT 
        session_count,
        total_time_spent,
        content_interactions,
        learning_streak
    INTO engagement_data
    FROM public.user_engagement_metrics
    WHERE user_id = target_user_id;
    
    -- Calculate learning velocity
    IF engagement_data.session_count > 0 AND engagement_data.total_time_spent > 0 THEN
        velocity := (engagement_data.content_interactions::DECIMAL / (engagement_data.total_time_spent / 3600.0));
    END IF;
    
    -- Analyze content preferences from recent interactions
    SELECT jsonb_object_agg(
        properties->>'content_type',
        COUNT(*)
    )
    INTO content_prefs
    FROM public.analytics_events
    WHERE user_id = target_user_id
    AND event_type = 'content_interaction'
    AND timestamp >= NOW() - INTERVAL '30 days'
    AND properties->>'content_type' IS NOT NULL
    GROUP BY properties->>'content_type';
    
    -- Analyze subject strengths from quiz performance
    SELECT jsonb_object_agg(
        learning_context->>'subject',
        ROUND(AVG((properties->>'score_percentage')::DECIMAL))
    )
    INTO subject_strengths
    FROM public.analytics_events
    WHERE user_id = target_user_id
    AND event_type = 'quiz_attempt'
    AND timestamp >= NOW() - INTERVAL '30 days'
    AND learning_context->>'subject' IS NOT NULL
    GROUP BY learning_context->>'subject';
    
    -- Update or insert profile
    INSERT INTO public.user_learning_profiles (
        user_id,
        subject_strengths,
        learning_velocity,
        preferred_content_types,
        updated_at
    ) VALUES (
        target_user_id,
        COALESCE(subject_strengths, '{}'),
        velocity,
        COALESCE(content_prefs, '{}'),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        subject_strengths = EXCLUDED.subject_strengths,
        learning_velocity = EXCLUDED.learning_velocity,
        preferred_content_types = EXCLUDED.preferred_content_types,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate learning path recommendations
CREATE OR REPLACE FUNCTION generate_path_recommendations(target_user_id UUID, max_recommendations INTEGER DEFAULT 5)
RETURNS TABLE (
    recommendation_id UUID,
    title TEXT,
    description TEXT,
    confidence_score DECIMAL,
    estimated_time INTEGER
) AS $$
DECLARE
    user_profile RECORD;
    subjects TEXT[];
    difficulty TEXT;
BEGIN
    -- Get user profile
    SELECT * INTO user_profile
    FROM public.user_learning_profiles
    WHERE user_id = target_user_id;
    
    -- If no profile exists, create basic recommendations
    IF user_profile IS NULL THEN
        RETURN QUERY
        SELECT 
            gen_random_uuid(),
            'Foundation Mathematics'::TEXT,
            'Build strong mathematical foundations'::TEXT,
            0.7::DECIMAL,
            1200 -- 20 hours
        LIMIT max_recommendations;
        RETURN;
    END IF;
    
    -- Extract user's strong subjects
    SELECT array_agg(key)
    INTO subjects
    FROM jsonb_each_text(user_profile.subject_strengths)
    WHERE value::INTEGER > 70;
    
    -- Determine appropriate difficulty
    difficulty := user_profile.difficulty_comfort_zone;
    
    -- Generate recommendations based on profile
    -- This is a simplified version - in practice, this would use ML algorithms
    RETURN QUERY
    SELECT 
        gen_random_uuid(),
        ('Advanced ' || COALESCE(subjects[1], 'Learning') || ' Path')::TEXT,
        ('Personalized path for mastering ' || COALESCE(subjects[1], 'new skills'))::TEXT,
        (0.6 + user_profile.profile_confidence * 0.4)::DECIMAL,
        (user_profile.learning_velocity * 600)::INTEGER -- velocity * 10 hours in minutes
    LIMIT max_recommendations;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.learning_path_recommendations
    WHERE expires_at < NOW()
    AND status = 'pending';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update learning profiles when analytics events are added
CREATE OR REPLACE FUNCTION trigger_update_learning_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Update profile asynchronously for performance
    PERFORM update_user_learning_profile(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on analytics events
DROP TRIGGER IF EXISTS analytics_update_profile ON public.analytics_events;
CREATE TRIGGER analytics_update_profile
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW
    WHEN (NEW.user_id IS NOT NULL AND NEW.event_type IN ('quiz_attempt', 'content_interaction'))
    EXECUTE FUNCTION trigger_update_learning_profile();

-- Row Level Security (RLS) Policies
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_milestones ENABLE ROW LEVEL SECURITY;

-- Learning Paths Policies
CREATE POLICY "Users can view own learning paths" ON public.learning_paths
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own learning paths" ON public.learning_paths
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths" ON public.learning_paths
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning paths" ON public.learning_paths
    FOR DELETE USING (auth.uid() = user_id);

-- Learning Path Progress Policies
CREATE POLICY "Users can view own progress" ON public.learning_path_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress" ON public.learning_path_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Learning Path Adaptations Policies
CREATE POLICY "Users can view own adaptations" ON public.learning_path_adaptations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own adaptations" ON public.learning_path_adaptations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Learning Profiles Policies
CREATE POLICY "Users can view own profile" ON public.user_learning_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_learning_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Learning Path Recommendations Policies
CREATE POLICY "Users can view own recommendations" ON public.learning_path_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations" ON public.learning_path_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

-- Learning Milestones Policies
CREATE POLICY "Users can view own milestones" ON public.learning_milestones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own milestones" ON public.learning_milestones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public access for learning objectives (read-only)
ALTER TABLE public.learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learning objectives are publicly readable" ON public.learning_objectives
    FOR SELECT USING (true);

CREATE POLICY "Content objectives are publicly readable" ON public.content_objectives
    FOR SELECT USING (true);