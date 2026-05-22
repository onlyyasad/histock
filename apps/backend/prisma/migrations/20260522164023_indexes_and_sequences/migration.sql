-- Required indexes (must not be deferred — documented in architecture decisions)
CREATE INDEX idx_orders_business_created ON orders(business_id, created_at);
CREATE INDEX idx_orders_business_status ON orders(business_id, status);

-- Partial index for delivery_failed tracking (COD is ~90% of Bangladesh orders)
CREATE INDEX idx_orders_delivery_failed_at
  ON orders(business_id, delivery_failed_at)
  WHERE delivery_failed_at IS NOT NULL;

-- Per-business ORDER SEQUENCE creation function
-- Sequence name: orders_seq_{business_id_with_hyphens_removed}
-- Gaps are allowed after rollback (documented architecture decision).
CREATE OR REPLACE FUNCTION create_business_order_sequence(business_uuid UUID)
RETURNS void AS $$
DECLARE
  seq_name TEXT;
BEGIN
  seq_name := 'orders_seq_' || replace(business_uuid::TEXT, '-', '');
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1 INCREMENT 1', seq_name);
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-create sequence when a business row is inserted
CREATE OR REPLACE FUNCTION trg_create_business_sequence()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_business_order_sequence(NEW.id::UUID);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_business_insert
  AFTER INSERT ON businesses
  FOR EACH ROW EXECUTE FUNCTION trg_create_business_sequence();

-- Unified users table integrity:
-- platform_admin MUST have NULL business_id; sellers MUST have non-NULL business_id
ALTER TABLE users
  ADD CONSTRAINT chk_admin_no_business
    CHECK (role != 'platform_admin' OR business_id IS NULL),
  ADD CONSTRAINT chk_seller_has_business
    CHECK (role  = 'platform_admin' OR business_id IS NOT NULL);

-- ticket_messages.sender_type domain enforcement at DB level
ALTER TABLE ticket_messages
  ADD CONSTRAINT chk_ticket_message_sender_type
    CHECK (sender_type IN ('admin', 'seller'));
