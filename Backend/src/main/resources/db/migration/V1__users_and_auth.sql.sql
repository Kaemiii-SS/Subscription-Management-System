CREATE TABLE users (
                       id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                       name          VARCHAR(120) NOT NULL,
                       email         VARCHAR(255) NOT NULL,
                       password_hash VARCHAR(100) NOT NULL,
                       phone         VARCHAR(20),
                       role          VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'CUSTOMER')),
                       active        BOOLEAN NOT NULL DEFAULT TRUE,
                       created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
                       updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_users_email ON users (lower(email));
CREATE INDEX idx_users_role_name ON users (role, lower(name) text_pattern_ops);

CREATE TABLE password_reset_tokens (
                                       id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                                       user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                       token_hash  VARCHAR(64) NOT NULL,
                                       expires_at  TIMESTAMPTZ NOT NULL,
                                       used_at     TIMESTAMPTZ,
                                       created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_reset_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX idx_reset_user ON password_reset_tokens (user_id);