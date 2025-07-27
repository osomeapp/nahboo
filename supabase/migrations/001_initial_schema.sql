-- Learning Platform Database Schema
-- Designed for enterprise scale: MVP → Millions of users
-- Supports horizontal sharding, partitioning, and multi-region deployment

-- ==================================================================
-- CORE EXTENSIONS
-- ==================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ==================================================================
-- PROFILES TABLE (User Management)
-- ==================================================================

-- Extends Supabase auth.users with application-specific data
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Core Profile Data
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Learning Profile
    subjects TEXT[] DEFAULT '{}', -- Array of subjects (math, science, etc.)
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    age_group TEXT DEFAULT 'adult' CHECK (age_group IN ('child', 'teen', 'adult', 'senior')),
    use_case TEXT DEFAULT 'personal' CHECK (use_case IN ('student', 'employee', 'personal', 'teacher')),
    
    -- Preferences
    language TEXT DEFAULT 'en' NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    
    -- Analytics & Engagement
    total_study_time INTEGER DEFAULT 0, -- in minutes
    streak_days INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Enterprise Features
    organization_id UUID REFERENCES public.organizations(id),
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')),
    
    -- Privacy & Safety
    is_verified BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    parental_consent BOOLEAN DEFAULT FALSE, -- Required for children
    
    -- Sharding Key (for horizontal scaling)
    shard_key INTEGER DEFAULT (RANDOM() * 1000)::INTEGER
);

-- ==================================================================
-- ORGANIZATIONS TABLE (Enterprise Support)
-- ==================================================================

CREATE TABLE public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('school', 'university', 'company', 'nonprofit')),
    domain TEXT UNIQUE, -- email domain for auto-enrollment
    settings JSONB DEFAULT '{}',
    
    -- Billing & Limits
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
    max_users INTEGER DEFAULT 50,
    billing_email TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- CONTENT TABLE (Learning Materials)
-- ==================================================================

CREATE TABLE public.content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Core Content Data
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT NOT NULL CHECK (content_type IN ('video', 'quiz', 'link', 'ai_lesson', 'interactive', 'text')),
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    
    -- Content Data (flexible JSONB for different types)
    metadata JSONB DEFAULT '{}', -- video_url, quiz_questions, link_url, etc.
    
    -- Categorization
    subject TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    age_groups TEXT[] DEFAULT '{adult}',
    
    -- Content Management
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'flagged')),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- AI Generated Content
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_tutor_id TEXT, -- Reference to AI tutor personality
    source_prompt TEXT, -- Original prompt used for generation
    
    -- Authoring
    created_by UUID REFERENCES public.profiles(id),
    organization_id UUID REFERENCES public.organizations(id),
    
    -- Performance Metrics (denormalized for speed)
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.0, -- percentage
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Full-text search (GIN index optimized)
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
    ) STORED,
    
    -- Sharding Key (content_id + created_at for time-based sharding)
    shard_key INTEGER DEFAULT (RANDOM() * 1000)::INTEGER,
    
    -- Partitioning Key (monthly partitions)
    partition_date DATE DEFAULT CURRENT_DATE
);

-- ==================================================================
-- INTERACTIONS TABLE (User Engagement Tracking)
-- ==================================================================

-- High-volume table optimized for time-series data
CREATE TABLE public.interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Core Interaction Data
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    
    -- Interaction Types
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'like', 'share', 'complete', 'start', 'pause', 'resume', 'quiz_attempt', 'ai_feedback')),
    
    -- Interaction Context
    session_id UUID NOT NULL, -- Group interactions by session
    device_type TEXT DEFAULT 'web' CHECK (device_type IN ('web', 'mobile', 'tablet')),
    user_agent TEXT,
    
    -- Time Tracking
    time_spent INTEGER DEFAULT 0, -- seconds spent on content
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    
    -- Interaction Data (flexible for different interaction types)
    interaction_data JSONB DEFAULT '{}', -- quiz_score, video_position, etc.
    
    -- Analytics Dimensions
    subject TEXT, -- denormalized for fast filtering
    difficulty_level TEXT, -- denormalized for fast filtering
    
    -- Timestamps (critical for time-series queries)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Sharding Key (user_id for user-based sharding)
    shard_key INTEGER,
    
    -- Partitioning Key (daily partitions for high volume)
    partition_date DATE DEFAULT CURRENT_DATE
);

-- ==================================================================
-- LEARNING_PATHS TABLE (Personalized Curricula)
-- ==================================================================

CREATE TABLE public.learning_paths (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Path Information
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    difficulty_level TEXT DEFAULT 'beginner',
    estimated_duration INTEGER, -- in minutes
    
    -- Path Content (ordered sequence)
    content_sequence UUID[] DEFAULT '{}', -- Array of content IDs in order
    prerequisites UUID[] DEFAULT '{}', -- Required content before starting
    
    -- AI-Generated Paths
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt TEXT,
    personalization_data JSONB DEFAULT '{}',
    
    -- Targeting
    target_age_groups TEXT[] DEFAULT '{adult}',
    target_use_cases TEXT[] DEFAULT '{personal}',
    
    -- Management
    created_by UUID REFERENCES public.profiles(id),
    organization_id UUID REFERENCES public.organizations(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- USER_PROGRESS TABLE (Learning Progress Tracking)
-- ==================================================================

CREATE TABLE public.user_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Progress Tracking
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
    learning_path_id UUID REFERENCES public.learning_paths(id) ON DELETE CASCADE,
    
    -- Progress Data
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    time_spent INTEGER DEFAULT 0, -- in seconds
    
    -- Performance Data
    quiz_scores JSONB DEFAULT '{}', -- Array of quiz attempt scores
    best_score DECIMAL(5,2) DEFAULT 0.0,
    attempts_count INTEGER DEFAULT 0,
    
    -- AI Feedback
    ai_feedback JSONB DEFAULT '{}',
    personalized_notes TEXT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, content_id),
    UNIQUE(user_id, learning_path_id)
);

-- ==================================================================
-- NOTIFICATIONS TABLE (User Communications)
-- ==================================================================

CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Notification Data
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('achievement', 'reminder', 'system', 'ai_recommendation', 'social')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Notification Context
    related_content_id UUID REFERENCES public.content(id),
    related_path_id UUID REFERENCES public.learning_paths(id),
    action_url TEXT,
    
    -- Delivery
    channels TEXT[] DEFAULT '{in_app}' CHECK (channels <@ ARRAY['in_app', 'email', 'push']),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ==================================================================
-- ANALYTICS_EVENTS TABLE (Product Analytics)
-- ==================================================================

-- High-volume table for product analytics and A/B testing
CREATE TABLE public.analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Event Data
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    event_name TEXT NOT NULL,
    
    -- Event Properties
    properties JSONB DEFAULT '{}',
    
    -- Context
    page_url TEXT,
    referrer TEXT,
    device_info JSONB DEFAULT '{}',
    
    -- A/B Testing
    experiment_ids TEXT[] DEFAULT '{}',
    variant_ids TEXT[] DEFAULT '{}',
    
    -- Location (for geo analytics)
    country_code TEXT,
    region TEXT,
    city TEXT,
    
    -- Timestamp (partitioning key)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    partition_date DATE DEFAULT CURRENT_DATE
);

-- ==================================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================================

-- Profiles Table Indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX idx_profiles_shard_key ON public.profiles(shard_key);
CREATE INDEX idx_profiles_last_active ON public.profiles(last_active);
CREATE INDEX idx_profiles_subjects_gin ON public.profiles USING gin(subjects);

-- Content Table Indexes
CREATE INDEX idx_content_type_subject ON public.content(content_type, subject);
CREATE INDEX idx_content_status_published ON public.content(status, published_at) WHERE status = 'published';
CREATE INDEX idx_content_search_vector_gin ON public.content USING gin(search_vector);
CREATE INDEX idx_content_tags_gin ON public.content USING gin(tags);
CREATE INDEX idx_content_age_groups_gin ON public.content USING gin(age_groups);
CREATE INDEX idx_content_created_by ON public.content(created_by);
CREATE INDEX idx_content_organization ON public.content(organization_id);
CREATE INDEX idx_content_ai_generated ON public.content(ai_generated, ai_tutor_id);
CREATE INDEX idx_content_performance ON public.content(view_count, like_count, completion_rate);

-- Interactions Table Indexes (optimized for time-series queries)
CREATE INDEX idx_interactions_user_time ON public.interactions(user_id, created_at DESC);
CREATE INDEX idx_interactions_content_time ON public.interactions(content_id, created_at DESC);
CREATE INDEX idx_interactions_session ON public.interactions(session_id);
CREATE INDEX idx_interactions_type_time ON public.interactions(interaction_type, created_at DESC);
CREATE INDEX idx_interactions_partition_date ON public.interactions(partition_date);

-- User Progress Indexes
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_content_id ON public.user_progress(content_id);
CREATE INDEX idx_user_progress_path_id ON public.user_progress(learning_path_id);
CREATE INDEX idx_user_progress_status ON public.user_progress(status);
CREATE INDEX idx_user_progress_last_accessed ON public.user_progress(last_accessed DESC);

-- Learning Paths Indexes
CREATE INDEX idx_learning_paths_subject ON public.learning_paths(subject);
CREATE INDEX idx_learning_paths_created_by ON public.learning_paths(created_by);
CREATE INDEX idx_learning_paths_organization ON public.learning_paths(organization_id);
CREATE INDEX idx_learning_paths_ai_generated ON public.learning_paths(ai_generated);

-- Notifications Indexes
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type_priority ON public.notifications(type, priority);

-- Analytics Events Indexes (time-series optimized)
CREATE INDEX idx_analytics_events_user_time ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_name_time ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX idx_analytics_events_partition_date ON public.analytics_events(partition_date);

-- ==================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_paths_updated_at BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update profile shard_key based on user_id
CREATE OR REPLACE FUNCTION set_shard_key_from_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.shard_key = (hashtext(NEW.user_id::text) % 1000);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply shard_key trigger to interactions
CREATE TRIGGER set_interactions_shard_key BEFORE INSERT ON public.interactions FOR EACH ROW EXECUTE FUNCTION set_shard_key_from_user_id();

-- ==================================================================
-- COMMENTS FOR DOCUMENTATION
-- ==================================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth with learning-specific data. Designed for horizontal sharding by shard_key.';
COMMENT ON TABLE public.organizations IS 'Enterprise organizations for schools, companies, etc. Supports multi-tenancy and billing.';
COMMENT ON TABLE public.content IS 'Learning content with flexible metadata. Optimized for full-text search and content recommendation algorithms.';
COMMENT ON TABLE public.interactions IS 'High-volume user interaction tracking. Partitioned by date for time-series analytics.';
COMMENT ON TABLE public.learning_paths IS 'Structured learning curricula. Supports AI-generated personalized paths.';
COMMENT ON TABLE public.user_progress IS 'Individual learning progress tracking. One record per user-content pair.';
COMMENT ON TABLE public.notifications IS 'User notification system supporting multiple delivery channels.';
COMMENT ON TABLE public.analytics_events IS 'Product analytics events for user behavior analysis and A/B testing.';

COMMENT ON COLUMN public.profiles.shard_key IS 'Sharding key for horizontal scaling. Random 0-999 for even distribution.';
COMMENT ON COLUMN public.content.search_vector IS 'Generated full-text search vector. Automatically updated on title/description changes.';
COMMENT ON COLUMN public.interactions.partition_date IS 'Partitioning key for time-based table partitioning.';
COMMENT ON COLUMN public.content.metadata IS 'Flexible JSONB field for content-type specific data (video_url, quiz_questions, etc.)';