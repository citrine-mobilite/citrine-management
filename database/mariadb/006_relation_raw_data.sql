-- Add raw_data JSON to relation tables so generic repository writes can preserve full documents.
SET @raw_data_exists_0 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'task_project_members' AND column_name = 'raw_data'
);
SET @raw_data_sql_0 = IF(
  @raw_data_exists_0 = 0,
  'ALTER TABLE `task_project_members` ADD COLUMN raw_data JSON NULL',
  'SELECT 1'
);
PREPARE raw_data_stmt_0 FROM @raw_data_sql_0;
EXECUTE raw_data_stmt_0;
DEALLOCATE PREPARE raw_data_stmt_0;

SET @raw_data_exists_1 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'task_assignees' AND column_name = 'raw_data'
);
SET @raw_data_sql_1 = IF(
  @raw_data_exists_1 = 0,
  'ALTER TABLE `task_assignees` ADD COLUMN raw_data JSON NULL',
  'SELECT 1'
);
PREPARE raw_data_stmt_1 FROM @raw_data_sql_1;
EXECUTE raw_data_stmt_1;
DEALLOCATE PREPARE raw_data_stmt_1;

SET @raw_data_exists_2 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'reminder_recipients' AND column_name = 'raw_data'
);
SET @raw_data_sql_2 = IF(
  @raw_data_exists_2 = 0,
  'ALTER TABLE `reminder_recipients` ADD COLUMN raw_data JSON NULL',
  'SELECT 1'
);
PREPARE raw_data_stmt_2 FROM @raw_data_sql_2;
EXECUTE raw_data_stmt_2;
DEALLOCATE PREPARE raw_data_stmt_2;

SET @raw_data_exists_3 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'notification_recipients' AND column_name = 'raw_data'
);
SET @raw_data_sql_3 = IF(
  @raw_data_exists_3 = 0,
  'ALTER TABLE `notification_recipients` ADD COLUMN raw_data JSON NULL',
  'SELECT 1'
);
PREPARE raw_data_stmt_3 FROM @raw_data_sql_3;
EXECUTE raw_data_stmt_3;
DEALLOCATE PREPARE raw_data_stmt_3;

SET @raw_data_exists_4 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'presence_pauses' AND column_name = 'raw_data'
);
SET @raw_data_sql_4 = IF(
  @raw_data_exists_4 = 0,
  'ALTER TABLE `presence_pauses` ADD COLUMN raw_data JSON NULL',
  'SELECT 1'
);
PREPARE raw_data_stmt_4 FROM @raw_data_sql_4;
EXECUTE raw_data_stmt_4;
DEALLOCATE PREPARE raw_data_stmt_4;

SET @raw_data_exists_5 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'inventory_assignments' AND column_name = 'raw_data'
);
SET @raw_data_sql_5 = IF(
  @raw_data_exists_5 = 0,
  'ALTER TABLE `inventory_assignments` ADD COLUMN raw_data JSON NULL',
  'SELECT 1'
);
PREPARE raw_data_stmt_5 FROM @raw_data_sql_5;
EXECUTE raw_data_stmt_5;
DEALLOCATE PREPARE raw_data_stmt_5;


SET @updated_at_exists_0 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'task_project_members' AND column_name = 'updated_at'
);
SET @updated_at_sql_0 = IF(
  @updated_at_exists_0 = 0,
  'ALTER TABLE `task_project_members` ADD COLUMN updated_at DATETIME(3) DEFAULT NOW(3)',
  'SELECT 1'
);
PREPARE updated_at_stmt_0 FROM @updated_at_sql_0;
EXECUTE updated_at_stmt_0;
DEALLOCATE PREPARE updated_at_stmt_0;

SET @updated_at_exists_1 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'task_assignees' AND column_name = 'updated_at'
);
SET @updated_at_sql_1 = IF(
  @updated_at_exists_1 = 0,
  'ALTER TABLE `task_assignees` ADD COLUMN updated_at DATETIME(3) DEFAULT NOW(3)',
  'SELECT 1'
);
PREPARE updated_at_stmt_1 FROM @updated_at_sql_1;
EXECUTE updated_at_stmt_1;
DEALLOCATE PREPARE updated_at_stmt_1;

SET @updated_at_exists_2 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'reminder_recipients' AND column_name = 'updated_at'
);
SET @updated_at_sql_2 = IF(
  @updated_at_exists_2 = 0,
  'ALTER TABLE `reminder_recipients` ADD COLUMN updated_at DATETIME(3) DEFAULT NOW(3)',
  'SELECT 1'
);
PREPARE updated_at_stmt_2 FROM @updated_at_sql_2;
EXECUTE updated_at_stmt_2;
DEALLOCATE PREPARE updated_at_stmt_2;

SET @updated_at_exists_3 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'notification_recipients' AND column_name = 'updated_at'
);
SET @updated_at_sql_3 = IF(
  @updated_at_exists_3 = 0,
  'ALTER TABLE `notification_recipients` ADD COLUMN updated_at DATETIME(3) DEFAULT NOW(3)',
  'SELECT 1'
);
PREPARE updated_at_stmt_3 FROM @updated_at_sql_3;
EXECUTE updated_at_stmt_3;
DEALLOCATE PREPARE updated_at_stmt_3;

SET @updated_at_exists_4 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'presence_pauses' AND column_name = 'updated_at'
);
SET @updated_at_sql_4 = IF(
  @updated_at_exists_4 = 0,
  'ALTER TABLE `presence_pauses` ADD COLUMN updated_at DATETIME(3) DEFAULT NOW(3)',
  'SELECT 1'
);
PREPARE updated_at_stmt_4 FROM @updated_at_sql_4;
EXECUTE updated_at_stmt_4;
DEALLOCATE PREPARE updated_at_stmt_4;

SET @updated_at_exists_5 = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'inventory_assignments' AND column_name = 'updated_at'
);
SET @updated_at_sql_5 = IF(
  @updated_at_exists_5 = 0,
  'ALTER TABLE `inventory_assignments` ADD COLUMN updated_at DATETIME(3) DEFAULT NOW(3)',
  'SELECT 1'
);
PREPARE updated_at_stmt_5 FROM @updated_at_sql_5;
EXECUTE updated_at_stmt_5;
DEALLOCATE PREPARE updated_at_stmt_5;