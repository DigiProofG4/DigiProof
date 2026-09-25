-- Optional. Run connected as DIGIPROOF, after 02_create_schema.sql.
-- Mirrors api/app/seed.py so the UI has something to show even before
-- the FastAPI backend is pointed at this database.
--
-- Password hash below is NOT a real bcrypt hash -- it's a placeholder so
-- you can see data in the tables. If you connect the FastAPI backend to
-- this database, register the demo accounts through the app instead, so
-- they get a real bcrypt hash and can actually log in.

INSERT INTO users (email, password_hash, full_name, role)
VALUES ('store@digiproof.example', 'placeholder-not-a-real-hash', 'Sunrise Electronics', 'retailer');

INSERT INTO users (email, password_hash, full_name, role)
VALUES ('buyer@digiproof.example', 'placeholder-not-a-real-hash', 'Ava Chen', 'customer');

INSERT INTO retailers (user_id, business_name, registration_number)
SELECT id, 'Sunrise Electronics', 'NZBN-9429041234567'
FROM users WHERE email = 'store@digiproof.example';

INSERT INTO products (retailer_id, name, brand, model, serial_number, warranty_months)
SELECT r.id, 'Aurora 27" Monitor', 'Aurora', 'A27-QHD', 'AUR-27-000451', 24
FROM retailers r WHERE r.business_name = 'Sunrise Electronics';

INSERT INTO warranties (
    product_id, owner_id, issued_by_retailer_id,
    purchase_date, expires_on, price_paid, terms, status,
    token_id, tx_hash, metadata_uri
)
SELECT
    p.id,
    u.id,
    r.id,
    DATE '2026-03-14',
    ADD_MONTHS(DATE '2026-03-14', 24),
    649.00,
    'Parts and labour. Covers panel defects, excludes accidental damage.',
    'active',
    '2405122348',
    '0x8f5b412c6a50902c7c41350c55c5c78d312da210d30ff2e935022f9b5fb82a6c',
    'ipfs://placeholder/demo-seed'
FROM products p
JOIN retailers r ON r.id = p.retailer_id
JOIN users u ON u.email = 'buyer@digiproof.example'
WHERE p.serial_number = 'AUR-27-000451';

INSERT INTO transfers (warranty_id, from_user_id, to_user_id, tx_hash)
SELECT w.id, NULL, u.id, w.tx_hash
FROM warranties w
JOIN users u ON u.email = 'buyer@digiproof.example'
WHERE w.token_id = '2405122348';

COMMIT;

-- Sanity check
SELECT w.id, p.name, u.email AS owner, w.status, w.expires_on
FROM warranties w
JOIN products p ON p.id = w.product_id
JOIN users u ON u.id = w.owner_id;
