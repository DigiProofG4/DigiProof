-- Adds the Account page settings to a database created before they existed.
-- New databases get them from 02_create_schema.sql, so skip this there.

USE digiproof;

ALTER TABLE users
    ADD COLUMN expiring_soon_days        INT NOT NULL DEFAULT 90 AFTER wallet_address,
    ADD COLUMN date_format               VARCHAR(10) NOT NULL DEFAULT 'long' AFTER expiring_soon_days;
