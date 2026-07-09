CREATE TABLE `access_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`method` text NOT NULL,
	`path` text NOT NULL,
	`status_code` integer NOT NULL,
	`duration_ms` integer,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`id_token` text,
	`password` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_name` text NOT NULL,
	`project` text,
	`status` text NOT NULL,
	`metadata` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text,
	`color` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `checks` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`status_code` integer,
	`response_ms` integer,
	`error` text,
	`tls_days_remaining` integer,
	`checked_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `discovery_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`config` text DEFAULT '{}',
	`last_sync` integer,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `machine_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`machine_id` text NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `machine_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT 'blue' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `machines` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`host` text NOT NULL,
	`type` text DEFAULT 'vps' NOT NULL,
	`cpu_cores` integer,
	`ram_gb` integer,
	`disk_gb` integer,
	`notes` text,
	`status` text DEFAULT 'unknown' NOT NULL,
	`last_seen` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`description` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_key_unique` ON `permissions` (`key`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`project_id` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `service_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`level` text DEFAULT 'info' NOT NULL,
	`message` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `service_machine` (
	`service_id` text NOT NULL,
	`machine_id` text NOT NULL,
	PRIMARY KEY(`service_id`, `machine_id`),
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`machine_id`) REFERENCES `machines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text,
	`port` integer,
	`description` text,
	`status` text DEFAULT 'unknown' NOT NULL,
	`category_id` text,
	`tags` text DEFAULT '[]',
	`docker_compose_snippet` text,
	`notes` text,
	`tls_expiry` integer,
	`tls_issuer` text,
	`last_checked` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`project_id` text,
	`assigned_by` text,
	`expires_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`owned_project_ids` text DEFAULT '[]',
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);