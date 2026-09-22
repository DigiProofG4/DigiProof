-- Run this second, against the digiproof database.
-- Creates every table the FastAPI backend needs, matching api/app/models.py
-- one-for-one. Safe to re-run: it drops its own tables first if they exist.

USE digiproof;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS warranties;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS retailers;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------- users
-- One login for both retailers and customers; ROLE decides which the UI
-- treats the account as.
CREATE TABLE users (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    full_name      VARCHAR(120) NOT NULL,
    role           ENUM('retailer', 'customer') NOT NULL,
    wallet_address VARCHAR(64) NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- retailers
-- Extra business details for an account whose role is 'retailer'.
CREATE TABLE retailers (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL UNIQUE,
    business_name       VARCHAR(160) NOT NULL,
    registration_number VARCHAR(80) NULL,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_retailers_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- products
CREATE TABLE products (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    retailer_id     INT NOT NULL,
    name            VARCHAR(160) NOT NULL,
    brand           VARCHAR(120) NULL,
    model           VARCHAR(120) NULL,
    serial_number   VARCHAR(120) NOT NULL UNIQUE,
    warranty_months INT NOT NULL DEFAULT 12,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_retailer FOREIGN KEY (retailer_id)
        REFERENCES retailers (id) ON DELETE CASCADE,
    INDEX ix_products_retailer (retailer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- warranties
-- One proof of purchase per product. token_id/tx_hash/metadata_uri mirror
-- the NFT once the blockchain phase is wired up (see contracts/README.md);
-- they stay NULL until then.
CREATE TABLE warranties (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    product_id            INT NOT NULL UNIQUE,
    owner_id              INT NOT NULL,
    issued_by_retailer_id INT NOT NULL,
    purchase_date         DATE NOT NULL,
    expires_on            DATE NOT NULL,
    price_paid            DECIMAL(12, 2) NULL,
    terms                 TEXT NULL,
    status                ENUM('pending', 'active', 'expired', 'void') NOT NULL DEFAULT 'pending',
    token_id              VARCHAR(80) NULL,
    tx_hash               VARCHAR(80) NULL,
    metadata_uri          VARCHAR(255) NULL,
    gas_used              BIGINT NULL,
    gas_price_wei         BIGINT NULL,
    block_number          BIGINT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_warranties_product FOREIGN KEY (product_id)
        REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_warranties_owner FOREIGN KEY (owner_id)
        REFERENCES users (id),
    CONSTRAINT fk_warranties_retailer FOREIGN KEY (issued_by_retailer_id)
        REFERENCES retailers (id),
    INDEX ix_warranties_owner (owner_id),
    INDEX ix_warranties_retailer (issued_by_retailer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- transfers
-- Ownership history. Row 1 for a warranty is the mint (from_user_id NULL);
-- every resale after that adds one more row.
CREATE TABLE transfers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    warranty_id    INT NOT NULL,
    from_user_id   INT NULL,
    to_user_id     INT NOT NULL,
    tx_hash        VARCHAR(80) NULL,
    transferred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_transfers_warranty FOREIGN KEY (warranty_id)
        REFERENCES warranties (id) ON DELETE CASCADE,
    CONSTRAINT fk_transfers_from FOREIGN KEY (from_user_id)
        REFERENCES users (id),
    CONSTRAINT fk_transfers_to FOREIGN KEY (to_user_id)
        REFERENCES users (id),
    INDEX ix_transfers_warranty (warranty_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sanity check
SHOW TABLES;
