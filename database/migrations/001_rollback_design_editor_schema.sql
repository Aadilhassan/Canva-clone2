-- ================================================================
-- Design Editor Schema Rollback Migration
-- Migration: 001_rollback_design_editor_schema
-- Created: 2025-06-28
-- Description: Rolls back the design editor schema changes
-- ================================================================

-- WARNING: This will permanently delete all design editor data!
-- Only run this if you want to completely remove the design editor functionality

-- ================================================================
-- DROP TABLES (in reverse dependency order)
-- ================================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS design_collection_items CASCADE;
DROP TABLE IF EXISTS design_comments CASCADE;
DROP TABLE IF EXISTS design_shares CASCADE;
DROP TABLE IF EXISTS design_assets CASCADE;
DROP TABLE IF EXISTS design_templates CASCADE;
DROP TABLE IF EXISTS design_collections CASCADE;
DROP TABLE IF EXISTS design_projects CASCADE;

-- ================================================================
-- DROP FUNCTIONS
-- ================================================================

DROP FUNCTION IF EXISTS create_design_from_template(UUID, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS update_design_last_saved() CASCADE;
DROP FUNCTION IF EXISTS is_workspace_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS has_workspace_role(UUID, TEXT) CASCADE;

-- Note: We don't drop update_updated_at_column() as it might be used by other tables

-- ================================================================
-- DROP CUSTOM TYPES
-- ================================================================

-- Drop custom types (only if they exist and no other tables use them)
DROP TYPE IF EXISTS share_permission CASCADE;
DROP TYPE IF EXISTS asset_type CASCADE;
DROP TYPE IF EXISTS design_status CASCADE;

-- ================================================================
-- REMOVE MIGRATION RECORD
-- ================================================================

-- Remove the migration record
DELETE FROM schema_migrations WHERE version = '001_create_design_editor_schema';

-- Success message
SELECT 'Design editor schema rollback completed successfully!' as status;
