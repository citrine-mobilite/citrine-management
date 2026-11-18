-- Add raw_data JSON to relation tables so generic repository writes can preserve full documents.
SET @raw_data_sql = (
  SELECT GROUP_CONCAT(
    IF(c.column_name IS NULL,
      CONCAT('ALTER TABLE `', t.table_name, '` ADD COLUMN raw_data JSON NULL'),
      'SELECT 1'
    ) SEPARATOR '; '
  )
  FROM (
    SELECT 'task_project_members' AS table_name UNION ALL
    SELECT 'task_assignees' UNION ALL
    SELECT 'reminder_recipients' UNION ALL
    SELECT 'notification_recipients' UNION ALL
    SELECT 'presence_pauses' UNION ALL
    SELECT 'inventory_assignments'
  ) AS t
  LEFT JOIN information_schema.columns c
    ON c.table_schema = DATABASE()
   AND c.table_name = t.table_name
   AND c.column_name = 'raw_data'
);
PREPARE relation_raw_data_stmt FROM @raw_data_sql;
EXECUTE relation_raw_data_stmt;
DEALLOCATE PREPARE relation_raw_data_stmt;
