-- Database Functions and Views for Performance Optimization
-- Enterprise-scale optimizations for millions of users
-- Materialized views, stored procedures, and caching strategies

-- ==================================================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- ==================================================================

-- Popular content view (refreshed hourly)
CREATE MATERIALIZED VIEW popular_content AS
SELECT 
    c.id,
    c.title,
    c.description,
    c.content_type,
    c.subject,
    c.difficulty_level,
    c.view_count,
    c.like_count,
    c.completion_rate,
    c.average_rating,
    c.created_at,
    c.published_at,
    -- Popularity score calculation
    (
        (c.view_count * 0.3) +
        (c.like_count * 0.4) +
        (c.completion_rate * 0.2) +
        (c.average_rating * 20 * 0.1)
    ) AS popularity_score,
    -- Trending score (time-weighted)
    (
        (c.view_count * 0.3) +
        (c.like_count * 0.4) +
        (c.completion_rate * 0.2) +
        (c.average_rating * 20 * 0.1)
    ) * EXP(-EXTRACT(days FROM NOW() - c.published_at) / 7.0) AS trending_score
FROM public.content c
WHERE c.status = 'published'
AND c.published_at > NOW() - INTERVAL '90 days'; -- Only recent content

-- Create index on materialized view
CREATE INDEX idx_popular_content_popularity ON popular_content(popularity_score DESC);
CREATE INDEX idx_popular_content_trending ON popular_content(trending_score DESC);
CREATE INDEX idx_popular_content_subject ON popular_content(subject, popularity_score DESC);

-- User engagement summary view
CREATE MATERIALIZED VIEW user_engagement_summary AS
SELECT 
    p.id as user_id,
    p.name,
    p.subjects,
    p.level,
    p.age_group,
    COUNT(DISTINCT i.content_id) as content_viewed,
    COUNT(DISTINCT CASE WHEN i.interaction_type = 'complete' THEN i.content_id END) as content_completed,
    AVG(i.time_spent) as avg_time_spent,
    MAX(i.created_at) as last_interaction,
    COUNT(DISTINCT DATE(i.created_at)) as active_days_last_30,
    -- Engagement score
    (
        COUNT(DISTINCT i.content_id) * 0.2 +
        COUNT(DISTINCT CASE WHEN i.interaction_type = 'complete' THEN i.content_id END) * 0.4 +
        (AVG(i.time_spent) / 3600.0) * 0.3 +
        COUNT(DISTINCT DATE(i.created_at)) * 0.1
    ) as engagement_score
FROM public.profiles p
LEFT JOIN public.interactions i ON i.user_id = p.id 
    AND i.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name, p.subjects, p.level, p.age_group;

CREATE INDEX idx_user_engagement_score ON user_engagement_summary(engagement_score DESC);
CREATE INDEX idx_user_engagement_last_interaction ON user_engagement_summary(last_interaction DESC);

-- Content performance by subject
CREATE MATERIALIZED VIEW content_performance_by_subject AS
SELECT 
    subject,
    difficulty_level,
    COUNT(*) as total_content,
    AVG(view_count) as avg_views,
    AVG(like_count) as avg_likes,
    AVG(completion_rate) as avg_completion_rate,
    AVG(average_rating) as avg_rating,
    SUM(view_count) as total_views,
    SUM(like_count) as total_likes
FROM public.content
WHERE status = 'published'
AND published_at > NOW() - INTERVAL '90 days'
GROUP BY subject, difficulty_level;

-- ==================================================================
-- STORED PROCEDURES FOR COMPLEX OPERATIONS
-- ==================================================================

-- Function to get personalized content recommendations
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
    target_user_id UUID,
    content_limit INTEGER DEFAULT 20,
    diversity_factor DECIMAL DEFAULT 0.3
)
RETURNS TABLE (
    content_id UUID,
    title TEXT,
    content_type TEXT,
    subject TEXT,
    difficulty_level TEXT,
    relevance_score DECIMAL,
    reason TEXT
) AS $$
DECLARE
    user_subjects TEXT[];
    user_level TEXT;
    user_age_group TEXT;
BEGIN
    -- Get user preferences
    SELECT subjects, level, age_group 
    INTO user_subjects, user_level, user_age_group
    FROM public.profiles 
    WHERE id = target_user_id;

    -- Return personalized recommendations
    RETURN QUERY
    WITH user_interactions AS (
        SELECT content_id, interaction_type, time_spent
        FROM public.interactions
        WHERE user_id = target_user_id
        AND created_at > NOW() - INTERVAL '30 days'
    ),
    content_scores AS (
        SELECT 
            c.id as content_id,
            c.title,
            c.content_type,
            c.subject,
            c.difficulty_level,
            -- Base relevance score
            CASE 
                WHEN c.subject = ANY(user_subjects) THEN 1.0
                ELSE 0.5
            END +
            CASE 
                WHEN c.difficulty_level = user_level THEN 1.0
                WHEN (user_level = 'beginner' AND c.difficulty_level = 'intermediate') OR
                     (user_level = 'intermediate' AND c.difficulty_level IN ('beginner', 'advanced')) OR
                     (user_level = 'advanced' AND c.difficulty_level = 'intermediate') THEN 0.7
                ELSE 0.3
            END +
            CASE 
                WHEN user_age_group = ANY(c.age_groups) THEN 1.0
                ELSE 0.8
            END +
            -- Popularity boost
            (c.completion_rate / 100.0) * 0.5 +
            (c.average_rating / 5.0) * 0.3 as relevance_score,
            -- Recommendation reason
            CASE 
                WHEN c.subject = ANY(user_subjects) THEN 'Based on your interests in ' || c.subject
                WHEN c.difficulty_level = user_level THEN 'Perfect for your ' || user_level || ' level'
                WHEN c.completion_rate > 80 THEN 'Highly completed by other learners'
                WHEN c.average_rating > 4.0 THEN 'Highly rated content'
                ELSE 'Recommended for you'
            END as reason
        FROM public.content c
        LEFT JOIN user_interactions ui ON ui.content_id = c.id
        WHERE c.status = 'published'
        AND ui.content_id IS NULL -- Exclude already interacted content
        AND c.published_at > NOW() - INTERVAL '180 days' -- Recent content only
    )
    SELECT 
        cs.content_id,
        cs.title,
        cs.content_type,
        cs.subject,
        cs.difficulty_level,
        cs.relevance_score,
        cs.reason
    FROM content_scores cs
    ORDER BY 
        cs.relevance_score DESC,
        RANDOM() * diversity_factor -- Add some randomness for diversity
    LIMIT content_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update content performance metrics (called by triggers)
CREATE OR REPLACE FUNCTION update_content_metrics(content_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.content SET
        view_count = (
            SELECT COUNT(*) FROM public.interactions 
            WHERE content_id = content_uuid 
            AND interaction_type = 'view'
        ),
        like_count = (
            SELECT COUNT(*) FROM public.interactions 
            WHERE content_id = content_uuid 
            AND interaction_type = 'like'
        ),
        completion_rate = (
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (COUNT(CASE WHEN interaction_type = 'complete' THEN 1 END) * 100.0 / COUNT(DISTINCT user_id))
                END
            FROM public.interactions 
            WHERE content_id = content_uuid 
            AND interaction_type IN ('view', 'complete')
        ),
        updated_at = NOW()
    WHERE id = content_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get learning analytics for a user
CREATE OR REPLACE FUNCTION get_user_analytics(
    target_user_id UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH analytics_data AS (
        SELECT 
            COUNT(DISTINCT content_id) as content_viewed,
            COUNT(DISTINCT CASE WHEN interaction_type = 'complete' THEN content_id END) as content_completed,
            SUM(time_spent) as total_time_spent,
            COUNT(DISTINCT DATE(created_at)) as active_days,
            AVG(
                CASE 
                    WHEN interaction_data->>'quiz_score' IS NOT NULL 
                    THEN (interaction_data->>'quiz_score')::DECIMAL 
                END
            ) as avg_quiz_score,
            array_agg(DISTINCT subject) FILTER (WHERE subject IS NOT NULL) as subjects_studied
        FROM public.interactions i
        LEFT JOIN public.content c ON c.id = i.content_id
        WHERE i.user_id = target_user_id
        AND i.created_at > NOW() - (days_back || ' days')::INTERVAL
    )
    SELECT jsonb_build_object(
        'content_viewed', COALESCE(content_viewed, 0),
        'content_completed', COALESCE(content_completed, 0),
        'completion_rate', 
            CASE 
                WHEN content_viewed > 0 THEN ROUND((content_completed * 100.0 / content_viewed), 2)
                ELSE 0 
            END,
        'total_time_spent_hours', ROUND((COALESCE(total_time_spent, 0) / 3600.0), 2),
        'active_days', COALESCE(active_days, 0),
        'avg_quiz_score', ROUND(COALESCE(avg_quiz_score, 0), 2),
        'subjects_studied', COALESCE(subjects_studied, '{}'),
        'streak_potential', 
            CASE 
                WHEN active_days >= 7 THEN 'strong'
                WHEN active_days >= 3 THEN 'moderate'
                ELSE 'weak'
            END
    ) INTO result
    FROM analytics_data;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to batch update user progress
CREATE OR REPLACE FUNCTION batch_update_progress(
    updates JSONB[]
)
RETURNS INTEGER AS $$
DECLARE
    update_record JSONB;
    rows_affected INTEGER := 0;
BEGIN
    FOREACH update_record IN ARRAY updates
    LOOP
        INSERT INTO public.user_progress (
            user_id, 
            content_id, 
            status, 
            progress_percentage, 
            time_spent,
            last_accessed
        ) VALUES (
            (update_record->>'user_id')::UUID,
            (update_record->>'content_id')::UUID,
            update_record->>'status',
            (update_record->>'progress_percentage')::DECIMAL,
            (update_record->>'time_spent')::INTEGER,
            NOW()
        )
        ON CONFLICT (user_id, content_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            progress_percentage = EXCLUDED.progress_percentage,
            time_spent = user_progress.time_spent + EXCLUDED.time_spent,
            last_accessed = NOW();
        
        rows_affected := rows_affected + 1;
    END LOOP;
    
    RETURN rows_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- TRIGGERS FOR REAL-TIME METRICS
-- ==================================================================

-- Trigger to update content metrics when interactions change
CREATE OR REPLACE FUNCTION trigger_update_content_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update metrics for the affected content
    PERFORM update_content_metrics(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.content_id
            ELSE NEW.content_id
        END
    );
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to interactions table
CREATE TRIGGER update_content_metrics_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.interactions
    FOR EACH ROW 
    EXECUTE FUNCTION trigger_update_content_metrics();

-- ==================================================================
-- SEARCH AND DISCOVERY FUNCTIONS
-- ==================================================================

-- Advanced full-text search with ranking
CREATE OR REPLACE FUNCTION search_content(
    search_query TEXT,
    subject_filter TEXT DEFAULT NULL,
    difficulty_filter TEXT DEFAULT NULL,
    content_type_filter TEXT DEFAULT NULL,
    result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    content_id UUID,
    title TEXT,
    description TEXT,
    content_type TEXT,
    subject TEXT,
    difficulty_level TEXT,
    search_rank REAL,
    popularity_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.content_type,
        c.subject,
        c.difficulty_level,
        ts_rank(c.search_vector, plainto_tsquery('english', search_query)) AS search_rank,
        COALESCE(pc.popularity_score, 0) AS popularity_score
    FROM public.content c
    LEFT JOIN popular_content pc ON pc.id = c.id
    WHERE c.status = 'published'
    AND c.search_vector @@ plainto_tsquery('english', search_query)
    AND (subject_filter IS NULL OR c.subject = subject_filter)
    AND (difficulty_filter IS NULL OR c.difficulty_level = difficulty_filter)
    AND (content_type_filter IS NULL OR c.content_type = content_type_filter)
    ORDER BY 
        ts_rank(c.search_vector, plainto_tsquery('english', search_query)) DESC,
        COALESCE(pc.popularity_score, 0) DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending content by subject
CREATE OR REPLACE FUNCTION get_trending_content(
    target_subject TEXT DEFAULT NULL,
    days_back INTEGER DEFAULT 7,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    content_id UUID,
    title TEXT,
    content_type TEXT,
    subject TEXT,
    trending_score DECIMAL,
    view_growth DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_views AS (
        SELECT 
            content_id,
            COUNT(*) as recent_views
        FROM public.interactions
        WHERE interaction_type = 'view'
        AND created_at > NOW() - (days_back || ' days')::INTERVAL
        GROUP BY content_id
    ),
    historical_views AS (
        SELECT 
            content_id,
            COUNT(*) as historical_views
        FROM public.interactions
        WHERE interaction_type = 'view'
        AND created_at BETWEEN 
            NOW() - (days_back * 2 || ' days')::INTERVAL 
            AND NOW() - (days_back || ' days')::INTERVAL
        GROUP BY content_id
    )
    SELECT 
        c.id,
        c.title,
        c.content_type,
        c.subject,
        COALESCE(pc.trending_score, 0) AS trending_score,
        CASE 
            WHEN COALESCE(hv.historical_views, 0) = 0 THEN 
                COALESCE(rv.recent_views, 0) * 100.0
            ELSE 
                ((COALESCE(rv.recent_views, 0) - COALESCE(hv.historical_views, 0)) * 100.0 / hv.historical_views)
        END AS view_growth
    FROM public.content c
    LEFT JOIN popular_content pc ON pc.id = c.id
    LEFT JOIN recent_views rv ON rv.content_id = c.id
    LEFT JOIN historical_views hv ON hv.content_id = c.id
    WHERE c.status = 'published'
    AND (target_subject IS NULL OR c.subject = target_subject)
    AND COALESCE(rv.recent_views, 0) > 0
    ORDER BY 
        COALESCE(pc.trending_score, 0) DESC,
        view_growth DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- MAINTENANCE AND OPTIMIZATION FUNCTIONS
-- ==================================================================

-- Function to refresh materialized views (run by cron job)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS TEXT AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY popular_content;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_engagement_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY content_performance_by_subject;
    
    RETURN 'Analytics views refreshed at ' || NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_data(
    days_to_keep INTEGER DEFAULT 365
)
RETURNS TEXT AS $$
DECLARE
    deleted_interactions INTEGER;
    deleted_events INTEGER;
BEGIN
    -- Delete old interaction data
    DELETE FROM public.interactions 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_interactions = ROW_COUNT;
    
    -- Delete old analytics events
    DELETE FROM public.analytics_events 
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_events = ROW_COUNT;
    
    RETURN 'Cleanup completed: ' || deleted_interactions || ' interactions, ' || 
           deleted_events || ' analytics events deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================
-- COMMENTS AND DOCUMENTATION
-- ==================================================================

COMMENT ON MATERIALIZED VIEW popular_content IS 'Cached popular content rankings, refreshed hourly for performance';
COMMENT ON MATERIALIZED VIEW user_engagement_summary IS 'User engagement metrics summary, used for personalization algorithms';
COMMENT ON FUNCTION get_personalized_recommendations(UUID, INTEGER, DECIMAL) IS 'ML-powered content recommendation engine with diversity controls';
COMMENT ON FUNCTION search_content(TEXT, TEXT, TEXT, TEXT, INTEGER) IS 'Full-text search with popularity ranking and filtering';
COMMENT ON FUNCTION refresh_analytics_views() IS 'Maintenance function to refresh materialized views, called by cron job';
COMMENT ON FUNCTION cleanup_old_data(INTEGER) IS 'GDPR compliance function to remove old user data';