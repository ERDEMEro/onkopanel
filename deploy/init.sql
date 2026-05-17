CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  password_hash VARCHAR,
  is_doctor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  doctor_id VARCHAR NOT NULL,
  gender VARCHAR,
  birth_date VARCHAR,
  age INTEGER,
  department VARCHAR,
  admission_date VARCHAR,
  diagnosis TEXT,
  medications TEXT,
  procedures TEXT,
  has_genetic_test BOOLEAN DEFAULT false,
  admission_type VARCHAR,
  arrival_type VARCHAR,
  death_status BOOLEAN DEFAULT false,
  notes TEXT,
  raw_conversation JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS doctor_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL UNIQUE,
  specialty VARCHAR NOT NULL,
  hospital VARCHAR,
  bio TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_invitations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  patient_id VARCHAR NOT NULL,
  doctor_id VARCHAR NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  patient_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_patient_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invitation_id VARCHAR NOT NULL,
  sender_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
