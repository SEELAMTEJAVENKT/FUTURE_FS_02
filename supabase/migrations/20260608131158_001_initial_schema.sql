/*
# LeadFlow CRM Initial Schema

## Overview
This migration creates the core database schema for LeadFlow CRM - a client lead management system.
The system supports both public lead submissions (no auth required) and admin management (auth required).

## Tables

1. `leads` - Main lead storage
   - id (uuid, primary key)
   - name (text, not null) - Full name of the lead
   - email (text, unique, not null) - Email address
   - phone (text) - Phone number
   - company (text) - Company name
   - source (text) - Lead source (Website, Referral, Social, Direct, Other)
   - message (text) - Initial message from contact form
   - status (text, default 'New') - Lead status workflow
   - priority (text, default 'Medium') - Lead priority level
   - created_at (timestamptz)
   - updated_at (timestamptz)

2. `follow_ups` - Follow-up scheduling
   - id (uuid, primary key)
   - lead_id (uuid, foreign key to leads)
   - date (date) - Follow-up date
   - time (time) - Follow-up time
   - note (text) - Follow-up notes
   - reminder_sent (boolean, default false)
   - completed (boolean, default false)
   - created_at (timestamptz)
   - created_by (uuid, references auth.users) - Admin who created it

3. `notes` - Lead notes
   - id (uuid, primary key)
   - lead_id (uuid, foreign key to leads)
   - content (text, not null)
   - created_at (timestamptz)
   - created_by (uuid, references auth.users) - Admin who created it
   - created_by_email (text) - Admin email for display

4. `status_history` - Track status changes
   - id (uuid, primary key)
   - lead_id (uuid, foreign key to leads)
   - old_status (text)
   - new_status (text)
   - changed_at (timestamptz)
   - changed_by (uuid, references auth.users)

## Security Notes

1. RLS enabled on all tables
2. Lead INSERT policy allows anonymous access (for public contact form)
3. All other operations require authentication (admin users)
4. Email uniqueness prevents duplicate submissions
*/

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    company text,
    source text NOT NULL DEFAULT 'Website',
    message text,
    status text NOT NULL DEFAULT 'New',
    priority text NOT NULL DEFAULT 'Medium',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Follow-ups table
CREATE TABLE IF NOT EXISTS follow_ups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    date date NOT NULL,
    time time,
    note text,
    reminder_sent boolean DEFAULT false,
    completed boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_email text
);

-- Status history table
CREATE TABLE IF NOT EXISTS status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    old_status text,
    new_status text NOT NULL,
    changed_at timestamptz DEFAULT now(),
    changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Lead policies: Anonymous can INSERT (public form), authenticated can do all
DROP POLICY IF EXISTS "Public can submit leads" ON leads;
CREATE POLICY "Public can submit leads" ON leads FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can read leads" ON leads;
CREATE POLICY "Authenticated can read leads" ON leads FOR SELECT
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can update leads" ON leads;
CREATE POLICY "Authenticated can update leads" ON leads FOR UPDATE
    TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete leads" ON leads;
CREATE POLICY "Authenticated can delete leads" ON leads FOR DELETE
    TO authenticated USING (true);

-- Follow-ups policies: Only authenticated users
DROP POLICY IF EXISTS "Authenticated can manage follow_ups" ON follow_ups;
CREATE POLICY "Authenticated can manage follow_ups" ON follow_ups
    TO authenticated USING (true) WITH CHECK (true);

-- Notes policies: Only authenticated users
DROP POLICY IF EXISTS "Authenticated can manage notes" ON notes;
CREATE POLICY "Authenticated can manage notes" ON notes
    TO authenticated USING (true) WITH CHECK (true);

-- Status history policies: Only authenticated users
DROP POLICY IF EXISTS "Authenticated can manage status_history" ON status_history;
CREATE POLICY "Authenticated can manage status_history" ON status_history
    TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(date);
CREATE INDEX IF NOT EXISTS idx_notes_lead_id ON notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_status_history_lead_id ON status_history(lead_id);

-- Function to automatically record status changes
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO status_history (lead_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for status changes
DROP TRIGGER IF EXISTS lead_status_change_trigger ON leads;
CREATE TRIGGER lead_status_change_trigger
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION record_status_change();

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();