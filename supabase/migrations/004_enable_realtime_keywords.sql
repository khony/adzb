-- =====================================================
-- ENABLE REALTIME FOR KEYWORDS TABLE
-- =====================================================

-- Add keywords table to the Realtime publication
-- This allows the Supabase Realtime service to broadcast changes
-- to subscribed clients

ALTER PUBLICATION supabase_realtime ADD TABLE keywords;

-- Verify the publication includes keywords
-- You can check this by running:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
