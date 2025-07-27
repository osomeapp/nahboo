-- Analytics Tables Migration
-- Comprehensive analytics system with user engagement, content performance, and platform metrics

-- Analytics Events Table (main event storage)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    properties JSONB DEFAULT '{}',
    user_agent TEXT,
    device_info JSONB,
    learning_context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Engagement Metrics Table (aggregated user data)
CREATE TABLE IF NOT EXISTS public.user_engagement_metrics (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    session_count INTEGER DEFAULT 0,
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    content_interactions INTEGER DEFAULT 0,
    quiz_completions INTEGER DEFAULT 0,
    ai_lesson_requests INTEGER DEFAULT 0,
    learning_streak INTEGER DEFAULT 0,
    last_active TIMESTAMPTZ,
    engagement_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Analytics Table (content performance metrics)
CREATE TABLE IF NOT EXISTS public.content_analytics (
    content_id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    average_time_spent INTEGER DEFAULT 0, -- in seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    total_ratings INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Metrics Table (daily platform statistics)
CREATE TABLE IF NOT EXISTS public.platform_metrics (
    date DATE PRIMARY KEY,
    daily_active_users INTEGER DEFAULT 0,
    weekly_active_users INTEGER DEFAULT 0,
    monthly_active_users INTEGER DEFAULT 0,
    new_user_signups INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_events INTEGER DEFAULT 0,
    average_session_duration INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Insights Table (AI-generated user insights)
CREATE TABLE IF NOT EXISTS public.learning_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    insights_data JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    UNIQUE(user_id, generated_at::date)
);

-- Performance Metrics Table (system performance tracking)
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit TEXT DEFAULT 'ms',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON public.analytics_events(user_id, timestamp);

-- Index for content analytics
CREATE INDEX IF NOT EXISTS idx_content_analytics_type ON public.content_analytics(content_type);
CREATE INDEX IF NOT EXISTS idx_content_analytics_views ON public.content_analytics(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_content_analytics_completion ON public.content_analytics(completion_rate DESC);

-- Index for platform metrics
CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON public.platform_metrics(date DESC);

-- Index for learning insights
CREATE INDEX IF NOT EXISTS idx_learning_insights_user_generated ON public.learning_insights(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_insights_expires ON public.learning_insights(expires_at);

-- Index for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_timestamp ON public.performance_metrics(metric_type, timestamp DESC);

-- Partitioning for analytics_events (monthly partitions)
-- This helps with performance when dealing with large amounts of event data
CREATE TABLE IF NOT EXISTS public.analytics_events_2024_01 PARTITION OF public.analytics_events
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE IF NOT EXISTS public.analytics_events_2024_02 PARTITION OF public.analytics_events
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add more partitions as needed (can be automated with a cron job)

-- Function to automatically create new partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS VOID AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old analytics data (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    -- Delete old analytics events
    DELETE FROM public.analytics_events 
    WHERE timestamp < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up expired learning insights
    DELETE FROM public.learning_insights 
    WHERE expires_at < NOW();
    
    -- Clean up old performance metrics (keep last 30 days)
    DELETE FROM public.performance_metrics 
    WHERE timestamp < (NOW() - INTERVAL '30 days');
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
    session_count INTEGER,
    total_time_spent INTEGER,
    content_interactions INTEGER,
    quiz_completions INTEGER
) RETURNS INTEGER AS $$
DECLARE
    session_weight DECIMAL := 0.2;
    time_weight DECIMAL := 0.3;
    interaction_weight DECIMAL := 0.3;
    completion_weight DECIMAL := 0.2;
    
    normalized_sessions DECIMAL;
    normalized_time DECIMAL;
    normalized_interactions DECIMAL;
    normalized_completions DECIMAL;
    
    score INTEGER;
BEGIN
    -- Normalize values (max values for 100% score)
    normalized_sessions := LEAST(session_count::DECIMAL / 30, 1); -- Max 30 sessions
    normalized_time := LEAST(total_time_spent::DECIMAL / (30 * 3600), 1); -- Max 30 hours
    normalized_interactions := LEAST(content_interactions::DECIMAL / 100, 1); -- Max 100 interactions
    normalized_completions := LEAST(quiz_completions::DECIMAL / 50, 1); -- Max 50 completions
    
    score := ROUND(
        (normalized_sessions * session_weight +
         normalized_time * time_weight +
         normalized_interactions * interaction_weight +
         normalized_completions * completion_weight) * 100
    );
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to get user learning insights summary
CREATE OR REPLACE FUNCTION get_user_learning_summary(target_user_id UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_events INTEGER,
    study_sessions INTEGER,
    content_consumed INTEGER,
    quizzes_completed INTEGER,
    ai_interactions INTEGER,
    avg_session_duration DECIMAL,
    learning_streak INTEGER,
    most_active_hour INTEGER,
    preferred_content_type TEXT,
    performance_trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_events AS (
        SELECT *
        FROM public.analytics_events 
        WHERE user_id = target_user_id 
        AND timestamp >= NOW() - (days_back || ' days')::INTERVAL
    ),
    session_data AS (
        SELECT DISTINCT session_id
        FROM user_events
        WHERE event_type = 'session_start'
    ),
    hourly_activity AS (
        SELECT EXTRACT(HOUR FROM timestamp) as hour, COUNT(*) as activity_count
        FROM user_events
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY activity_count DESC
        LIMIT 1
    ),
    content_preferences AS (
        SELECT 
            properties->>'content_type' as content_type,
            COUNT(*) as usage_count
        FROM user_events
        WHERE event_type = 'content_interaction'
        AND properties->>'content_type' IS NOT NULL
        GROUP BY properties->>'content_type'
        ORDER BY usage_count DESC
        LIMIT 1
    )
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM user_events),
        (SELECT COUNT(*)::INTEGER FROM session_data),
        (SELECT COUNT(*)::INTEGER FROM user_events WHERE event_type = 'content_interaction'),
        (SELECT COUNT(*)::INTEGER FROM user_events WHERE event_type = 'quiz_attempt'),
        (SELECT COUNT(*)::INTEGER FROM user_events WHERE event_type = 'ai_lesson_request'),
        COALESCE((
            SELECT AVG(CAST(properties->>'session_duration' AS INTEGER))
            FROM user_events 
            WHERE event_type = 'session_end' 
            AND properties->>'session_duration' IS NOT NULL
        ), 0),
        COALESCE((SELECT learning_streak FROM public.user_engagement_metrics WHERE user_id = target_user_id), 0),
        COALESCE((SELECT hour::INTEGER FROM hourly_activity), 12),
        COALESCE((SELECT content_type FROM content_preferences), 'unknown'),
        'stable'::TEXT; -- Simplified for now, could be calculated based on quiz scores over time
END;
$$ LANGUAGE plpgsql;

-- Function to update materialized views (for performance)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    -- This would refresh materialized views if we had them
    -- For now, it's a placeholder for future optimizations
    
    -- Update user engagement metrics from recent events
    INSERT INTO public.user_engagement_metrics (user_id, session_count, content_interactions, quiz_completions, ai_lesson_requests, last_active, updated_at)
    SELECT 
        user_id,
        COUNT(DISTINCT CASE WHEN event_type = 'session_start' THEN session_id END) as sessions,
        COUNT(CASE WHEN event_type = 'content_interaction' THEN 1 END) as interactions,
        COUNT(CASE WHEN event_type = 'quiz_attempt' THEN 1 END) as quizzes,
        COUNT(CASE WHEN event_type = 'ai_lesson_request' THEN 1 END) as ai_requests,
        MAX(timestamp) as last_active,
        NOW()
    FROM public.analytics_events 
    WHERE user_id IS NOT NULL 
    AND timestamp >= NOW() - INTERVAL '1 day'
    GROUP BY user_id
    ON CONFLICT (user_id) DO UPDATE SET
        session_count = user_engagement_metrics.session_count + EXCLUDED.session_count,
        content_interactions = user_engagement_metrics.content_interactions + EXCLUDED.content_interactions,
        quiz_completions = user_engagement_metrics.quiz_completions + EXCLUDED.quiz_completions,
        ai_lesson_requests = user_engagement_metrics.ai_lesson_requests + EXCLUDED.ai_lesson_requests,
        last_active = GREATEST(user_engagement_metrics.last_active, EXCLUDED.last_active),
        updated_at = NOW();
    
    -- Calculate engagement scores
    UPDATE public.user_engagement_metrics 
    SET engagement_score = calculate_engagement_score(session_count, total_time_spent, content_interactions, quiz_completions)
    WHERE updated_at >= NOW() - INTERVAL '1 day';
    
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update engagement metrics
CREATE OR REPLACE FUNCTION update_engagement_metrics_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user engagement metrics when new events are inserted
    IF NEW.user_id IS NOT NULL THEN
        INSERT INTO public.user_engagement_metrics (user_id, last_active, updated_at)
        VALUES (NEW.user_id, NEW.timestamp, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            last_active = GREATEST(user_engagement_metrics.last_active, NEW.timestamp),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS analytics_events_engagement_update ON public.analytics_events;
CREATE TRIGGER analytics_events_engagement_update
    AFTER INSERT ON public.analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION update_engagement_metrics_trigger();

-- Create a scheduled job to run maintenance tasks (requires pg_cron extension)
-- This would typically be set up separately in production
/*
SELECT cron.schedule('analytics-maintenance', '0 2 * * *', 
    'SELECT refresh_analytics_views(); SELECT cleanup_old_analytics_data(90);'
);
*/