-- ═══════════════════════════════════════════════════════════════════════════════
--                    PRODUCTION DATABASE INDEXES
--                    DAFC OTB Platform - Performance Optimization
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Mục tiêu: Tối ưu queries cho datasets lớn (50,000+ SKUs, 1M+ records)
--
-- Cách sử dụng:
-- psql -d dafc_otb -f production_indexes.sql
-- Hoặc chạy trong Prisma migrate
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ===========================================
-- SKU ITEMS - Bảng lớn nhất, cần optimize kỹ
-- ===========================================

-- Index cho filtering theo proposal + status (query phổ biến nhất)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_proposal_status
ON sku_items (proposal_id, validation_status);

-- Index cho search SKU code (exact match + prefix search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_sku_code
ON sku_items (sku_code);

-- Index cho filtering theo category hierarchy
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_category
ON sku_items (category_id, subcategory_id);

-- Index cho filtering theo gender
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_gender
ON sku_items (gender);

-- Index cho sorting/filtering theo created date (reporting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_created
ON sku_items (created_at DESC);

-- Composite index cho listing với pagination
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_listing
ON sku_items (proposal_id, created_at DESC, id);

-- Index cho aggregation queries (total value, quantity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_aggregation
ON sku_items (proposal_id) INCLUDE (order_quantity, order_value, retail_price, cost_price);

-- ===========================================
-- SKU PROPOSALS
-- ===========================================

-- Index cho filtering theo OTB Plan
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_proposals_otb
ON sku_proposals (otb_plan_id, status);

-- Index cho filtering theo brand + season
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_proposals_brand_season
ON sku_proposals (brand_id, season_id);

-- Index cho user's proposals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_proposals_creator
ON sku_proposals (created_by_id, created_at DESC);

-- ===========================================
-- OTB PLANS
-- ===========================================

-- Index cho filtering theo budget
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otb_plans_budget
ON otb_plans (budget_id, status);

-- Index cho filtering theo brand + season
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otb_plans_brand_season
ON otb_plans (brand_id, season_id);

-- Index cho version tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otb_plans_version
ON otb_plans (parent_version_id);

-- ===========================================
-- OTB LINE ITEMS
-- ===========================================

-- Index cho hierarchy queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otb_line_items_plan_level
ON otb_line_items (otb_plan_id, level);

-- Index cho category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otb_line_items_category
ON otb_line_items (category_id, subcategory_id);

-- Index cho anomaly detection queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otb_line_items_anomaly
ON otb_line_items (otb_plan_id, has_anomaly) WHERE has_anomaly = true;

-- ===========================================
-- BUDGET ALLOCATIONS
-- ===========================================

-- Index cho filtering theo season + brand + location
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_season_brand_location
ON budget_allocations (season_id, brand_id, location_id);

-- Index cho status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_status
ON budget_allocations (status, created_at DESC);

-- ===========================================
-- WORKFLOWS
-- ===========================================

-- Index cho pending workflows
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_pending
ON workflows (status, type) WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Index cho reference lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_reference
ON workflows (reference_type, reference_id);

-- Index cho SLA tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_sla
ON workflows (sla_deadline) WHERE sla_deadline IS NOT NULL AND status = 'IN_PROGRESS';

-- ===========================================
-- WORKFLOW STEPS
-- ===========================================

-- Index cho assigned user's pending steps
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_steps_assigned
ON workflow_steps (assigned_user_id, status) WHERE status IN ('PENDING', 'IN_PROGRESS');

-- Index cho role-based assignment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflow_steps_role
ON workflow_steps (assigned_role, status) WHERE status IN ('PENDING', 'IN_PROGRESS');

-- ===========================================
-- NOTIFICATIONS
-- ===========================================

-- Index cho user's unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
ON notifications (user_id, is_read, created_at DESC) WHERE is_read = false;

-- ===========================================
-- AUDIT LOGS
-- ===========================================

-- Index cho filtering theo entity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_entity
ON audit_logs (entity_type, entity_id);

-- Index cho user activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user
ON audit_logs (user_id, created_at DESC);

-- Index cho time-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_time
ON audit_logs (created_at DESC);

-- ===========================================
-- KPI VALUES (Analytics)
-- ===========================================

-- Index cho KPI queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_values_lookup
ON kpi_values (kpi_id, period_start, period_end);

-- Index cho dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpi_values_dashboard
ON kpi_values (period_type, period_start DESC);

-- ===========================================
-- AI CONVERSATIONS & MESSAGES
-- ===========================================

-- Index cho user's conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversations_user
ON ai_conversations (user_id, updated_at DESC);

-- Index cho messages in conversation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_conversation
ON ai_messages (conversation_id, created_at);

-- ===========================================
-- MASTER DATA
-- ===========================================

-- Index cho brand lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_division
ON brands (division_id, is_active);

-- Index cho category lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active
ON categories (is_active, sort_order);

-- Index cho subcategory lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subcategories_category
ON subcategories (category_id, is_active);

-- ===========================================
-- PARTIAL INDEXES (Optimized for common queries)
-- ===========================================

-- Active users only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active
ON users (email) WHERE status = 'ACTIVE';

-- Draft budgets (frequently accessed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_draft
ON budget_allocations (created_by_id, created_at DESC) WHERE status = 'DRAFT';

-- Pending approvals
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_proposals_pending
ON sku_proposals (status, submitted_at) WHERE status IN ('SUBMITTED', 'VALIDATING');

-- ===========================================
-- TEXT SEARCH INDEXES (for search functionality)
-- ===========================================

-- Full-text search on SKU items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sku_items_fts
ON sku_items USING gin(to_tsvector('english', coalesce(sku_code, '') || ' ' || coalesce(style_name, '') || ' ' || coalesce(color_name, '')));

-- Full-text search on brands
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_fts
ON brands USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(code, '')));

-- ===========================================
-- STATISTICS UPDATE
-- ===========================================

-- After creating indexes, update statistics
ANALYZE sku_items;
ANALYZE sku_proposals;
ANALYZE otb_plans;
ANALYZE otb_line_items;
ANALYZE budget_allocations;
ANALYZE workflows;
ANALYZE workflow_steps;
ANALYZE notifications;

-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERY OPTIMIZATION TIPS:
--
-- 1. SKU Items Listing (paginated):
--    SELECT * FROM sku_items
--    WHERE proposal_id = ?
--    ORDER BY created_at DESC
--    LIMIT 50 OFFSET 0;
--    → Uses idx_sku_items_listing
--
-- 2. Aggregation Query:
--    SELECT SUM(order_quantity), SUM(order_value)
--    FROM sku_items WHERE proposal_id = ?;
--    → Uses idx_sku_items_aggregation (covering index)
--
-- 3. Text Search:
--    SELECT * FROM sku_items
--    WHERE to_tsvector('english', sku_code || ' ' || style_name) @@ to_tsquery('shirt & blue');
--    → Uses idx_sku_items_fts
--
-- ═══════════════════════════════════════════════════════════════════════════════
