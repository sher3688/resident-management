-- Supabase Migration: Add missing columns and create missing tables
-- Run this in Supabase SQL Editor after the initial table creation

-- Add isActive column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isActive" INTEGER DEFAULT 1 NOT NULL;

-- Add isActive column to user_sessions table
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "isActive" INTEGER DEFAULT 1 NOT NULL;

-- Add additional columns that the app schema expects
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "squareMeters" VARCHAR(32);
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "waterMeterNumber" VARCHAR(32);
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "electricityMeterNumber" VARCHAR(32);
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "moveInDate" DATE;
ALTER TABLE "residents" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "repair_requests" ADD COLUMN IF NOT EXISTS "repairDate" VARCHAR(32);
ALTER TABLE "repair_requests" ADD COLUMN IF NOT EXISTS "handlerNotes" TEXT;
ALTER TABLE "repair_requests" ADD COLUMN IF NOT EXISTS "completedDate" DATE;

-- Create co_residents table if not exists
CREATE TABLE IF NOT EXISTS co_residents (
  id SERIAL PRIMARY KEY,
  "residentId" INTEGER NOT NULL,
  name VARCHAR(64) NOT NULL,
  phone VARCHAR(32),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  "entityId" INTEGER,
  changes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add missing columns to renovation_applications
ALTER TABLE "renovation_applications" ADD COLUMN IF NOT EXISTS "applicationDate" VARCHAR(32);
ALTER TABLE "renovation_applications" ADD COLUMN IF NOT EXISTS "constructionStartDate" VARCHAR(32);
ALTER TABLE "renovation_applications" ADD COLUMN IF NOT EXISTS "constructionEndDate" VARCHAR(32);
ALTER TABLE "renovation_applications" ADD COLUMN IF NOT EXISTS "constructionContent" VARCHAR(255);
ALTER TABLE "renovation_applications" ADD COLUMN IF NOT EXISTS "consentLetterPasted" VARCHAR(32);
ALTER TABLE "renovation_applications" ADD COLUMN IF NOT EXISTS "decorationDeposit" VARCHAR(32);
ALTER TABLE "renovation_applications" ADD COLUMN IF NOT EXISTS "registeredBy" VARCHAR(64);

-- Add missing columns to resource_files
ALTER TABLE "resource_files" ADD COLUMN IF NOT EXISTS "uploadedBy" INTEGER;

-- Add missing columns to operation_logs
ALTER TABLE "operation_logs" ADD COLUMN IF NOT EXISTS "ipAddress" VARCHAR(45);
ALTER TABLE "operation_logs" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "operation_logs" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
ALTER TABLE "operation_logs" ADD COLUMN IF NOT EXISTS "targetId" INTEGER;

-- Add missing columns to user_sessions
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "sessionToken" VARCHAR(255);
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "ipAddress" VARCHAR(45);
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "deviceName" VARCHAR(255);
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "loginAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "logoutAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to invited_users
ALTER TABLE "invited_users" ADD COLUMN IF NOT EXISTS "role" VARCHAR(32) DEFAULT 'user' NOT NULL;
ALTER TABLE "invited_users" ADD COLUMN IF NOT EXISTS "status" VARCHAR(32) DEFAULT 'pending' NOT NULL;
ALTER TABLE "invited_users" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "invited_users" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "invited_users" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "invited_users" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "invited_users" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to resource_folders
ALTER TABLE "resource_folders" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "resource_folders" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "resource_folders" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add missing columns to resource_files
ALTER TABLE "resource_files" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "resource_files" ADD COLUMN IF NOT EXISTS "fileType" VARCHAR(32) DEFAULT 'pdf';
ALTER TABLE "resource_files" ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;
ALTER TABLE "resource_files" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "resource_files" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make sessionToken unique
DO $$ BEGIN
  ALTER TABLE "user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_sessionToken_key";
  ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_sessionToken_key" UNIQUE ("sessionToken");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Make openId unique in users
DO $$ BEGIN
  ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_openId_key";
  ALTER TABLE "users" ADD CONSTRAINT "users_openId_key" UNIQUE ("openId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Make email unique in users
DO $$ BEGIN
  ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";
  ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Make userId unique in password_users
DO $$ BEGIN
  ALTER TABLE "password_users" DROP CONSTRAINT IF EXISTS "password_users_userId_key";
  ALTER TABLE "password_users" ADD CONSTRAINT "password_users_userId_key" UNIQUE ("userId");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Make email unique in invited_users
DO $$ BEGIN
  ALTER TABLE "invited_users" DROP CONSTRAINT IF EXISTS "invited_users_email_key";
  ALTER TABLE "invited_users" ADD CONSTRAINT "invited_users_email_key" UNIQUE ("email");
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Make folderId in resource_files reference resource_folders
DO $$ BEGIN
  ALTER TABLE "resource_files" DROP CONSTRAINT IF EXISTS "resource_files_folderId_fkey";
  ALTER TABLE "resource_files" ADD CONSTRAINT "resource_files_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "resource_folders"("id") ON DELETE SET NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
