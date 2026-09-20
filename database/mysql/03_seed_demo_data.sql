-- Run against the digiproof database, after 02_create_schema.sql.
-- Creates the shared demo users and sample warranty data.
-- Both demo users use the password: password123

USE digiproof;

INSERT INTO users (email, password_hash, full_name, role)
VALUES ('admin@digiproof.com', '$2b$12$AMKmsB3ftZstNh6Q6G5ZA.SsQAgWWsxgsOFKEQtfzzejPuSzVH8gC', 'Sunrise Electronics', 'retailer');

INSERT INTO users (email, password_hash, full_name, role)
VALUES ('buyer@digiproof.com', '$2b$12$AMKmsB3ftZstNh6Q6G5ZA.SsQAgWWsxgsOFKEQtfzzejPuSzVH8gC', 'Ava Chen', 'customer');

INSERT INTO retailers (user_id, business_name, registration_number)
SELECT id, 'Sunrise Electronics', 'NZBN-9429041234567'
FROM users WHERE email = 'admin@digiproof.com';

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
    '2026-03-14',
    DATE_ADD('2026-03-14', INTERVAL 24 MONTH),
    649.00,
    'Parts and labour. Covers panel defects, excludes accidental damage.',
    'active',
    '2405122348',
    '0x8f5b412c6a50902c7c41350c55c5c78d312da210d30ff2e935022f9b5fb82a6c',
    'ipfs://placeholder/demo-seed'
FROM products p
JOIN retailers r ON r.id = p.retailer_id
JOIN users u ON u.email = 'buyer@digiproof.com'
WHERE p.serial_number = 'AUR-27-000451';

INSERT INTO transfers (warranty_id, from_user_id, to_user_id, tx_hash)
SELECT w.id, NULL, u.id, w.tx_hash
FROM warranties w
JOIN users u ON u.email = 'buyer@digiproof.com'
WHERE w.token_id = '2405122348';

-- Sanity check
SELECT w.id, p.name, u.email AS owner, w.status, w.expires_on
FROM warranties w
JOIN products p ON p.id = w.product_id
JOIN users u ON u.id = w.owner_id;
