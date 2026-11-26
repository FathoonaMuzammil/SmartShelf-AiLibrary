USE smartshelf_db;

-- Check whether the is_archived column already exists
SET @column_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Books'
      AND COLUMN_NAME = 'is_archived'
);

-- Add the column only if it does not already exist
SET @sql = IF(
    @column_exists = 0,
    'ALTER TABLE Books
     ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE
     AFTER cover_image_url',
    'SELECT "is_archived column already exists" AS message'
);

PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

-- Verify the column
DESCRIBE Books;