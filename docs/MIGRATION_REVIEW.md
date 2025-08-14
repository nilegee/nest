# Database Migration Review Checklist

Use this checklist when reviewing PRs that contain database migrations.

## Pre-Review Checklist (Author)

- [ ] **Migration file naming**: Uses 14-digit UTC timestamp (`YYYYMMDDHHMMSS_description.sql`)
- [ ] **Single logical change**: One focused change per migration file
- [ ] **SQL syntax check**: Validated locally before committing
- [ ] **Backwards compatibility**: Changes won't break existing app during deployment
- [ ] **Safe operations**: Uses `IF EXISTS` / `IF NOT EXISTS` where appropriate
- [ ] **No local execution**: Did NOT run migration locally—commit and push only

## Migration Review (Reviewer)

### 🔍 Safety Assessment
- [ ] **Destructive operations**: No `DROP TABLE`, `DROP COLUMN` without proper safeguards
- [ ] **Data migration**: If moving/transforming data, split into multiple releases
- [ ] **Critical tables**: Extra scrutiny for `profiles`, `families`, `auth.*` changes
- [ ] **RLS policies**: New tables have appropriate Row Level Security policies
- [ ] **Performance impact**: Large table alterations considered for impact

### 📋 Technical Review
- [ ] **SQL correctness**: Syntax is valid PostgreSQL
- [ ] **Dependencies**: Prerequisites (tables/columns) exist or are created first
- [ ] **Indexes**: Performance indexes added where needed
- [ ] **Constraints**: Foreign keys and constraints are appropriate
- [ ] **Types**: Column types match intended use

### 🚦 Deployment Readiness
- [ ] **Rollback plan**: Can be safely rolled back if needed
- [ ] **Zero downtime**: Won't cause app errors during migration execution
- [ ] **Schema verification**: Migration should pass existing `verify-schema.sql`
- [ ] **CI pipeline**: Workflow will apply migrations in correct order

## High-Risk Changes (Require Extra Review)

### 🚨 Always Require Senior Review
- [ ] Dropping tables or columns
- [ ] Changing column types (especially with data)
- [ ] Modifying `auth.*` tables
- [ ] Large data migrations (>1M rows)
- [ ] Changes to critical business logic tables

### ⚠️ Backwards Compatibility Concerns
- [ ] Renaming tables or columns
- [ ] Adding NOT NULL constraints to existing columns
- [ ] Changing primary keys or foreign keys
- [ ] Modifying enum values (removing options)

## Post-Merge Validation

### ✅ Verify Successful Deployment
- [ ] **GitHub Actions log**: Check migration applied successfully
- [ ] **No errors**: Pipeline completed without failures
- [ ] **Schema verification**: Post-migration verification scripts passed
- [ ] **Application health**: App continues to function normally

### 🔄 Rollback Preparation (If Needed)
- [ ] **Backup available**: Pre-migration backup artifact exists
- [ ] **Rollback migration**: Create reverse migration if issues arise
- [ ] **Emergency contact**: Team lead available during deployment

## Common Rejection Criteria

### ❌ Auto-Reject These Changes
- [ ] **Manual DB changes**: Evidence of local database execution
- [ ] **Multiple unrelated changes**: Bundle of unrelated migrations
- [ ] **Missing IF EXISTS**: Dropping non-existent objects without safeguards
- [ ] **Syntax errors**: Invalid SQL that would break deployment
- [ ] **No description**: Unclear what the migration accomplishes

### 🤔 Request Changes For
- [ ] **Poor naming**: Non-descriptive migration filename
- [ ] **Missing indexes**: Performance-critical queries without indexes
- [ ] **No RLS**: New tables without Row Level Security policies
- [ ] **Breaking changes**: Would cause app errors during deployment

## Emergency Procedures

### 🆘 If Migration Fails
1. **Don't panic**: Pipeline blocks on failure—DB is safe
2. **Check logs**: Review GitHub Actions logs for specific error
3. **Create fix**: New migration to resolve the issue
4. **Never edit**: Don't modify the failed migration file
5. **Follow process**: Commit and push the fix migration

### 🔥 If App Breaks Post-Migration
1. **Assess impact**: Determine scope of the issue
2. **Quick fix**: Create hotfix migration if possible
3. **Rollback option**: Use manual DB reset as last resort
4. **Post-mortem**: Review what went wrong and improve process

## Resources

- **Migration documentation**: `supabase/README.md`
- **Schema verification**: `scripts/verify-schema.sql`
- **RLS verification**: `scripts/verify-rls.sql`
- **Emergency reset**: `.github/workflows/db-reset.yml` (last resort)

---

**Remember**: Database migrations are permanent and affect all users. When in doubt, ask for a second opinion!