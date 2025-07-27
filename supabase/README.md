# Supabase Database Setup
## Enterprise-Scale Learning Platform Database

This directory contains the complete database schema, migrations, and configuration for the Learning Platform, designed to scale from MVP (0 users) to enterprise level (millions of users).

## 🚀 Quick Start

### 1. Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) installed
- PostgreSQL 15+ (if running locally)
- Node.js 18+ (for TypeScript types)

### 2. Setup Supabase Project

```bash
# Initialize Supabase in your project
supabase init

# Start local development environment
supabase start

# Or link to existing Supabase project
supabase link --project-ref your-project-ref
```

### 3. Run Migrations

```bash
# Apply all migrations to local database
supabase db reset

# Or apply to remote database
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > ../src/types/database.ts
```

### 4. Environment Configuration

```bash
# Copy environment template
cp ../.env.local.example ../.env.local

# Add your Supabase credentials to .env.local:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_key (for admin operations)
```

## 📊 Database Architecture

### Core Tables

| Table | Purpose | Scale Considerations |
|-------|---------|----------------------|
| `profiles` | User data extending auth.users | Sharded by user_id hash |
| `content` | Learning materials | Partitioned by date, full-text search |
| `interactions` | User engagement tracking | Time-series partitioning |
| `learning_paths` | Structured curricula | AI-generated and manual paths |
| `user_progress` | Individual learning progress | One-to-one with user-content pairs |
| `organizations` | Enterprise multi-tenancy | Supports schools, companies |
| `notifications` | User communication system | Multi-channel delivery |
| `analytics_events` | Product analytics | High-volume event tracking |

### Performance Features

- **Horizontal Sharding**: Ready for user-based sharding across databases
- **Time-series Partitioning**: Automatic monthly/daily partitions for high-volume tables
- **Full-text Search**: Optimized GIN indexes for content discovery
- **Materialized Views**: Pre-computed analytics for dashboard performance
- **Connection Pooling**: Configured for enterprise connection management

### Security Features

- **Row Level Security (RLS)**: Comprehensive policies for data protection
- **Multi-tenancy**: Organization-based data isolation
- **Child Protection**: COPPA compliance with parental consent tracking
- **Audit Logging**: Complete operation tracking for compliance
- **Role-based Access**: Student, teacher, admin, super_admin roles

## 🔧 Migration Files

### 001_initial_schema.sql
- Core table definitions
- Indexes for performance
- Triggers for automatic updates
- Comments and documentation

### 002_rls_policies.sql
- Row Level Security policies
- Multi-tenancy support
- Child protection (COPPA compliance)
- Audit logging functions

### 003_functions_views.sql
- Materialized views for analytics
- Stored procedures for complex operations
- Search and recommendation functions
- Maintenance and cleanup procedures

## 🎯 Key Features

### Personalization Engine
```sql
-- Get AI-powered content recommendations
SELECT * FROM get_personalized_recommendations(
  target_user_id := 'user-uuid',
  content_limit := 20,
  diversity_factor := 0.3
);
```

### Full-text Search
```sql
-- Advanced content search with ranking
SELECT * FROM search_content(
  search_query := 'machine learning',
  subject_filter := 'technology',
  difficulty_filter := 'intermediate',
  result_limit := 10
);
```

### Analytics Functions
```sql
-- Get comprehensive user analytics
SELECT get_user_analytics(
  target_user_id := 'user-uuid',
  days_back := 30
);
```

### Real-time Features
- Live progress tracking
- Instant notifications
- Collaborative learning sessions
- Real-time analytics updates

## 📈 Scaling Strategy

### Stage 1: MVP (0-10K users)
- Single Supabase instance
- Basic RLS policies
- Standard indexes

### Stage 2: Growth (10K-100K users)  
- Read replicas
- Materialized view optimization
- Enhanced caching

### Stage 3: Scale (100K-1M users)
- Horizontal sharding implementation
- Multi-region deployment
- Advanced partitioning

### Stage 4: Enterprise (1M+ users)
- Database cluster management
- Global content delivery
- Advanced analytics pipeline

## 🛡️ Security & Compliance

### Data Protection
- **GDPR Compliance**: Right to be forgotten, data portability
- **COPPA Compliance**: Parental consent for children
- **SOC 2**: Audit logging and access controls
- **FERPA**: Educational record protection

### Authentication Flow
1. User signs up via Supabase Auth
2. Profile created with RLS protection
3. Organization assignment (if applicable)
4. Role-based permission assignment

### Child Safety
- Age verification during onboarding
- Parental consent tracking
- Content filtering by age group
- Interaction monitoring and reporting

## 🔄 Maintenance Operations

### Daily Operations
```sql
-- Refresh analytics views (automated via cron)
SELECT refresh_analytics_views();

-- Clean up old interaction data (GDPR compliance)
SELECT cleanup_old_data(days_to_keep := 365);
```

### Performance Monitoring
```sql
-- Check database health
SELECT pg_stat_database;

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## 🚨 Troubleshooting

### Common Issues

**Migration Fails**
```bash
# Reset local database
supabase db reset

# Check migration syntax
supabase db lint
```

**RLS Policy Errors**
```sql
-- Check current user context
SELECT auth.uid(), auth.role();

-- Test policy with EXPLAIN
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM profiles WHERE id = auth.uid();
```

**Performance Issues**
```sql
-- Find slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1;
```

### Backup & Recovery

```bash
# Create backup
supabase db dump --file backup.sql

# Restore from backup
supabase db reset
psql -f backup.sql
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Scaling Patterns](https://supabase.com/docs/guides/platform/scalability)

## 🤝 Contributing

When adding new migrations:

1. Create numbered migration file (004_feature_name.sql)
2. Include rollback instructions in comments
3. Test on local database first
4. Update TypeScript types: `supabase gen types typescript --local`
5. Document schema changes in this README

## 📞 Support

For database-related issues:
- Check logs: `supabase logs`
- Monitor metrics: Supabase Dashboard
- Review slow queries: PostgreSQL stats
- Enterprise support: Contact Supabase team