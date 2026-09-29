-- Adds the optional note a previous owner can leave when transferring a warranty.
-- New databases get it from 02_create_schema.sql, so skip this there.

USE digiproof;

ALTER TABLE transfers ADD COLUMN message VARCHAR(200) NULL AFTER tx_hash;
