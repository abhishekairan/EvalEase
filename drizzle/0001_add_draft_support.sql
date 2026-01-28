-- Add draft support to sessions table
ALTER TABLE `sessions` ADD COLUMN `is_draft` boolean NOT NULL DEFAULT true;
ALTER TABLE `sessions` ADD COLUMN `published_at` timestamp;
