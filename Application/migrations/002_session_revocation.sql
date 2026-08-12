-- ---------------------------------------------------------------------------
-- Revoking sessions when a password changes                    (9 August 2026)
-- ---------------------------------------------------------------------------
-- Raised in the external review: the session cookie carries a user id and an
-- expiry and nothing else, so changing a password left every existing session
-- signed in for up to eight more hours. That is exactly backwards — the reason
-- someone changes a password in a hurry is to end sessions they do not control.
--
-- The cookie now carries this number as well, and a request is rejected when the
-- two disagree. Bumping it therefore signs out every device at once, which is
-- what `npm run db:user` does whenever it sets a password.
--
-- Starts at 1 rather than 0 so a token minted before this column existed — which
-- carries no version at all — cannot accidentally compare equal to it.
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;
