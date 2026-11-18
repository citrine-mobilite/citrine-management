-- Add the employee/day lookup index used by atomic attendance writes.
SET @presence_index_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'presences'
    AND index_name = 'idx_presences_employee_date'
);
SET @presence_index_sql = IF(
  @presence_index_exists = 0,
  'CREATE INDEX idx_presences_employee_date ON presences (employee_id, date)',
  'SELECT 1'
);
PREPARE presence_index_stmt FROM @presence_index_sql;
EXECUTE presence_index_stmt;
DEALLOCATE PREPARE presence_index_stmt;
