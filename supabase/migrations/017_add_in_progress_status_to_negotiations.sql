-- Add 'in_progress' value to negotiation_status enum
ALTER TYPE negotiation_status ADD VALUE IF NOT EXISTS 'in_progress';
