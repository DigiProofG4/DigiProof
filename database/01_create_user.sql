-- Run this ONE TIME, connected as SYS or SYSTEM (or another DBA account).
-- It creates a dedicated user/schema for the DigiProof project, separate
-- from your DWH coursework data.
--
-- In SQL Developer: open a new connection as SYS (role: SYSDBA) or SYSTEM
-- against the same database your DWH connection points at, open a new
-- SQL Worksheet on that connection, paste this in, then run it as a
-- script (F5), not a single statement (Ctrl+Enter).

-- Change this password before running.
CREATE USER digiproof IDENTIFIED BY "ChangeMe_2026!";

GRANT CONNECT, RESOURCE TO digiproof;
GRANT CREATE VIEW TO digiproof;
GRANT UNLIMITED TABLESPACE TO digiproof;

-- Sanity check
SELECT username, account_status FROM dba_users WHERE username = 'DIGIPROOF';
