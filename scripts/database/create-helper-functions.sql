-- Helper functions for data import validation and verification

-- Function to check for orphaned fragrances
CREATE OR REPLACE FUNCTION check_orphaned_fragrances()
RETURNS TABLE(fragrance_id text, brand_id text)
LANGUAGE sql
AS $$
  SELECT f.id as fragrance_id, f.brand_id
  FROM fragrances f
  LEFT JOIN fragrance_brands b ON f.brand_id = b.id
  WHERE b.id IS NULL;
$$;

-- Function to get foreign key constraints
CREATE OR REPLACE FUNCTION get_foreign_key_constraints()
RETURNS TABLE(constraint_name text, table_name text, column_name text, foreign_table text, foreign_column text)
LANGUAGE sql
AS $$
  SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY';
$$;

-- Function to find orphaned fragrances (RPC function for client calls)
CREATE OR REPLACE FUNCTION find_orphaned_fragrances()
RETURNS TABLE(id text, brand_id text)
LANGUAGE sql
AS $$
  SELECT f.id, f.brand_id
  FROM fragrances f
  LEFT JOIN fragrance_brands b ON f.brand_id = b.id
  WHERE b.id IS NULL
  LIMIT 10;
$$;