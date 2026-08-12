-- ---------------------------------------------------------------------------
-- The admin signs in with a username, not an email address  (11 August 2026)
-- ---------------------------------------------------------------------------
-- The login identifier was an email address, which made it look like the site
-- would email that account — it never did. There is no password reset by email,
-- no notification, no verification: the column was only ever a name to type into
-- a login box.
--
-- Calling it `username` says that. It also keeps the project's real address,
-- `info@iresi.eu`, doing exactly one job — receiving contact form messages —
-- rather than doubling as a login that would then have to change if the mailbox
-- ever did.
--
-- `RENAME COLUMN` keeps the rows, the primary key, and the unique index that was
-- built on the old name, so existing accounts survive with their passwords and
-- session versions intact. Anything already in the column is a valid username;
-- an address like `info@iresi.eu` simply reads as an odd one, which is why the
-- accounts are replaced by hand after this runs.
ALTER TABLE admin_users RENAME COLUMN email TO username;

-- The unique index followed the rename but kept its old name, which would leave
-- a constraint called `..._email_key` guarding a column called `username` — the
-- kind of small untruth that costs someone ten minutes in two years' time.
ALTER TABLE admin_users RENAME CONSTRAINT admin_users_email_key TO admin_users_username_key;
