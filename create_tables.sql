-- Create enums
DO $$ BEGIN
  CREATE TYPE "parking_type" AS ENUM('car', 'motorcycle', 'bicycle');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "repair_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled', 'resident_self_repair');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "login_method" AS ENUM('email', 'password');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "role" AS ENUM('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "renovation_status" AS ENUM('pending', 'approved', 'completed', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "decoration_deposit_status" AS ENUM('notPaid', 'paid', 'refunded');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "operation_log_status" AS ENUM('success', 'failure');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "invited_status" AS ENUM('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create tables (only if not exists)
CREATE TABLE IF NOT EXISTS "residents" (
  "id" serial PRIMARY KEY NOT NULL,
  "unitNumber" varchar(32) NOT NULL,
  "ownerName" varchar(64) NOT NULL,
  "ownerPhone" varchar(32),
  "coResident1Name" varchar(64),
  "coResident1Phone" varchar(32),
  "coResident2Name" varchar(64),
  "coResident2Phone" varchar(32),
  "coResident3Name" varchar(64),
  "coResident3Phone" varchar(32),
  "coResident4Name" varchar(64),
  "coResident4Phone" varchar(32),
  "carParkingNumber" varchar(32),
  "carPlateNumber" varchar(32),
  "motorcycleParkingNumber" varchar(32),
  "motorcyclePlateNumber" varchar(32),
  "bicycleParkingNumber" varchar(32),
  "address" text,
  "emergencyContactName" varchar(64),
  "emergencyContactPhone" varchar(32),
  "emergencyContactRelation" varchar(32),
  "emergencyContactAddress" text,
  "emergencyContact2Name" varchar(64),
  "emergencyContact2Phone" varchar(32),
  "emergencyContact2Relation" varchar(32),
  "emergencyContact2Address" text,
  "squareMeters" varchar(32),
  "waterMeterNumber" varchar(32),
  "electricityMeterNumber" varchar(32),
  "moveInDate" date,
  "notes" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "co_residents" (
  "id" serial PRIMARY KEY NOT NULL,
  "residentId" integer NOT NULL,
  "name" varchar(64) NOT NULL,
  "phone" varchar(32),
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "parkings" (
  "id" serial PRIMARY KEY NOT NULL,
  "residentId" integer NOT NULL,
  "type" "parking_type" NOT NULL,
  "number" varchar(32) NOT NULL,
  "plate" varchar(32),
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "parking_plates" (
  "id" serial PRIMARY KEY NOT NULL,
  "parkingId" integer NOT NULL,
  "plate" varchar(32) NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "emergency_contacts" (
  "id" serial PRIMARY KEY NOT NULL,
  "residentId" integer NOT NULL,
  "name" varchar(64) NOT NULL,
  "phone" varchar(32),
  "relationship" varchar(32),
  "address" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "repair_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "repairDate" varchar(32) NOT NULL,
  "unitNumber" varchar(32) NOT NULL,
  "description" text NOT NULL,
  "status" "repair_status" DEFAULT 'pending',
  "notes" text,
  "completionDate" varchar(32),
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "action" varchar(50) NOT NULL,
  "entity" varchar(50) NOT NULL,
  "entityId" integer,
  "changes" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "openId" varchar(255) NOT NULL,
  "name" varchar(64) NOT NULL,
  "email" varchar(255) NOT NULL,
  "loginMethod" "login_method" DEFAULT 'email',
  "role" "role" DEFAULT 'user',
  "isActive" integer DEFAULT 1 NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "lastSignedIn" timestamp with time zone,
  CONSTRAINT "users_openId_unique" UNIQUE("openId"),
  CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "password_users" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "passwordHash" varchar(255) NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "password_users_userId_unique" UNIQUE("userId")
);

CREATE TABLE IF NOT EXISTS "renovation_applications" (
  "id" serial PRIMARY KEY NOT NULL,
  "unitNumber" varchar(32) NOT NULL,
  "applicationDate" varchar(32) NOT NULL,
  "constructionStartDate" varchar(32),
  "constructionEndDate" varchar(32),
  "constructionContent" varchar(255) NOT NULL,
  "consentLetterPasted" varchar(32),
  "applicantName" varchar(64) NOT NULL,
  "applicantPhone" varchar(32) NOT NULL,
  "registeredBy" varchar(64),
  "status" "renovation_status" DEFAULT 'pending',
  "decorationDeposit" varchar(32),
  "decorationDepositStatus" "decoration_deposit_status" DEFAULT 'notPaid',
  "notes" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "operation_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "action" varchar(64) NOT NULL,
  "module" varchar(64) NOT NULL,
  "targetId" integer,
  "targetType" varchar(64),
  "description" text,
  "details" jsonb,
  "ipAddress" varchar(45),
  "userAgent" text,
  "status" "operation_log_status" DEFAULT 'success',
  "errorMessage" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "sessionToken" varchar(255) NOT NULL,
  "ipAddress" varchar(45),
  "userAgent" text,
  "deviceName" varchar(255),
  "loginAt" timestamp with time zone DEFAULT now() NOT NULL,
  "lastActivityAt" timestamp with time zone DEFAULT now() NOT NULL,
  "logoutAt" timestamp with time zone,
  "isActive" integer DEFAULT 1 NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "user_sessions_sessionToken_unique" UNIQUE("sessionToken")
);

CREATE TABLE IF NOT EXISTS "invited_users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "name" varchar(64),
  "role" varchar(32) DEFAULT 'user' NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "invitedBy" integer,
  "invitedAt" timestamp with time zone DEFAULT now() NOT NULL,
  "acceptedAt" timestamp with time zone,
  "notes" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "invited_users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "resource_folders" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "resource_files" (
  "id" serial PRIMARY KEY NOT NULL,
  "folderId" integer NOT NULL,
  "name" varchar(255) NOT NULL,
  "fileUrl" text NOT NULL,
  "fileSize" integer,
  "fileType" varchar(32) DEFAULT 'pdf',
  "uploadedBy" integer,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
