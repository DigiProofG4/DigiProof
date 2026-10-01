-- Adds the product photo column to a database created before it existed.
-- New databases get it from 02_create_schema.sql, so skip this there.
-- Holds an https:// link or /uploads/products/<file> for an uploaded photo.

USE digiproof;

ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL AFTER warranty_months;
