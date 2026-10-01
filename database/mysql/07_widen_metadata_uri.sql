-- Token metadata is now stored as a data: URI (JSON + certificate image),
-- which is far longer than 255 characters. Widen the column on databases
-- created before this change; new ones get TEXT from 02_create_schema.sql.

USE digiproof;

ALTER TABLE warranties MODIFY metadata_uri TEXT NULL;
