ALTER TABLE `board` ADD `organization_id` text NOT NULL REFERENCES organization(id);--> statement-breakpoint
CREATE INDEX `board_organization_id_idx` ON `board` (`organization_id`);--> statement-breakpoint
CREATE INDEX `board_user_org_is_deleted_idx` ON `board` (`user_id`,`organization_id`,`is_deleted`);