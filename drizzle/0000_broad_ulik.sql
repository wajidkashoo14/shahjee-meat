CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`role` text DEFAULT 'customer' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`ban_expires` integer,
	`locale` text DEFAULT 'en' NOT NULL,
	`points_balance` integer DEFAULT 0 NOT NULL,
	`phone` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title_en` text NOT NULL,
	`title_ja` text NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_ja` text DEFAULT '' NOT NULL,
	`hero_image` text NOT NULL,
	`kind` text DEFAULT 'manual' NOT NULL,
	`rule_tag` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`variant_id` text NOT NULL,
	`change` integer NOT NULL,
	`reason` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `inventory_movements_variant_idx` ON `inventory_movements` (`variant_id`);--> statement-breakpoint
CREATE TABLE `product_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`collection_id` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_collections_unique` ON `product_collections` (`product_id`,`collection_id`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text NOT NULL,
	`alt` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`sku` text NOT NULL,
	`label_en` text NOT NULL,
	`label_ja` text NOT NULL,
	`weight_grams` integer NOT NULL,
	`price_jpy` integer NOT NULL,
	`compare_at_price_jpy` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_sku_unique` ON `product_variants` (`sku`);--> statement-breakpoint
CREATE INDEX `product_variants_product_idx` ON `product_variants` (`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_ja` text NOT NULL,
	`subtitle_en` text DEFAULT '' NOT NULL,
	`subtitle_ja` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`description_ja` text DEFAULT '' NOT NULL,
	`cooking_guide_en` text DEFAULT '' NOT NULL,
	`cooking_guide_ja` text DEFAULT '' NOT NULL,
	`origin` text DEFAULT '' NOT NULL,
	`feed` text,
	`grade` text,
	`cut` text,
	`category` text NOT NULL,
	`tags_csv` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`publish_at` integer,
	`is_new_arrival` integer DEFAULT false NOT NULL,
	`sales_count` integer DEFAULT 0 NOT NULL,
	`rating_avg` real DEFAULT 0 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `products_status_idx` ON `products` (`status`);--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`label_en` text NOT NULL,
	`label_ja` text NOT NULL,
	`kind` text DEFAULT 'general' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text DEFAULT 'Home' NOT NULL,
	`full_name` text NOT NULL,
	`full_name_kana` text DEFAULT '' NOT NULL,
	`phone` text NOT NULL,
	`postal_code` text NOT NULL,
	`prefecture` text NOT NULL,
	`city` text NOT NULL,
	`address_line1` text NOT NULL,
	`address_line2` text DEFAULT '' NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `addresses_user_idx` ON `addresses` (`user_id`);--> statement-breakpoint
CREATE TABLE `cart_items` (
	`id` text PRIMARY KEY NOT NULL,
	`cart_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`cart_id`) REFERENCES `carts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cart_items_cart_idx` ON `cart_items` (`cart_id`);--> statement-breakpoint
CREATE TABLE `carts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`guest_token` text,
	`promo_code` text,
	`gift_note` text DEFAULT '' NOT NULL,
	`delivery_date` text,
	`delivery_slot` text,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `carts_guest_token_unique` ON `carts` (`guest_token`);--> statement-breakpoint
CREATE TABLE `discount_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`discount_id` text NOT NULL,
	`order_id` text NOT NULL,
	`user_id` text,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`discount_id`) REFERENCES `discounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `discounts` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`kind` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`min_spend_jpy` integer DEFAULT 0 NOT NULL,
	`usage_limit` integer,
	`usage_limit_per_customer` integer,
	`times_used` integer DEFAULT 0 NOT NULL,
	`collection_ids_csv` text DEFAULT '' NOT NULL,
	`starts_at` integer,
	`ends_at` integer,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discounts_code_unique` ON `discounts` (`code`);--> statement-breakpoint
CREATE TABLE `loyalty_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`points` integer NOT NULL,
	`reason` text NOT NULL,
	`order_id` text,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text,
	`variant_id` text,
	`name_en` text NOT NULL,
	`name_ja` text NOT NULL,
	`variant_label_en` text NOT NULL,
	`variant_label_ja` text NOT NULL,
	`image` text DEFAULT '' NOT NULL,
	`unit_price_jpy` integer NOT NULL,
	`quantity` integer NOT NULL,
	`line_total_jpy` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`status` text DEFAULT 'paid' NOT NULL,
	`subtotal_jpy` integer NOT NULL,
	`shipping_jpy` integer NOT NULL,
	`discount_jpy` integer DEFAULT 0 NOT NULL,
	`tax_jpy` integer NOT NULL,
	`total_jpy` integer NOT NULL,
	`points_earned` integer DEFAULT 0 NOT NULL,
	`points_redeemed` integer DEFAULT 0 NOT NULL,
	`promo_code` text,
	`shipping_name` text NOT NULL,
	`shipping_name_kana` text DEFAULT '' NOT NULL,
	`shipping_phone` text NOT NULL,
	`shipping_postal_code` text NOT NULL,
	`shipping_prefecture` text NOT NULL,
	`shipping_city` text NOT NULL,
	`shipping_address_line1` text NOT NULL,
	`shipping_address_line2` text DEFAULT '' NOT NULL,
	`delivery_date` text NOT NULL,
	`delivery_slot` text NOT NULL,
	`gift_note` text DEFAULT '' NOT NULL,
	`payment_method` text DEFAULT 'test' NOT NULL,
	`payment_intent_id` text,
	`carrier` text,
	`tracking_number` text,
	`cancel_cutoff_at` integer,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`code` text NOT NULL,
	`times_redeemed` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `referrals_code_unique` ON `referrals` (`code`);--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`amount_jpy` integer NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscription_items` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`variant_id` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`variant_id`) REFERENCES `product_variants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'Meat Box' NOT NULL,
	`frequency_weeks` integer DEFAULT 2 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`next_delivery_date` text NOT NULL,
	`delivery_slot` text DEFAULT 'morning' NOT NULL,
	`total_jpy` integer DEFAULT 0 NOT NULL,
	`address_id` text,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`address_id`) REFERENCES `addresses`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`question_id` text NOT NULL,
	`author_name` text DEFAULT 'Whole Cuts Staff' NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'general' NOT NULL,
	`product_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`user_id` text,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `questions_product_idx` ON `questions` (`product_id`);--> statement-breakpoint
CREATE TABLE `review_images` (
	`id` text PRIMARY KEY NOT NULL,
	`review_id` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`review_id`) REFERENCES `reviews`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`user_id` text,
	`author_name` text NOT NULL,
	`rating` integer NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`verified_purchase` integer DEFAULT false NOT NULL,
	`helpful_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'approved' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `reviews_product_idx` ON `reviews` (`product_id`);--> statement-breakpoint
CREATE TABLE `stock_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`variant_id` text NOT NULL,
	`product_id` text NOT NULL,
	`notified` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stock_alerts_variant_idx` ON `stock_alerts` (`variant_id`);--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wishlists_unique` ON `wishlists` (`user_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `recipe_products` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity_label` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `recipe_products_recipe_idx` ON `recipe_products` (`recipe_id`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title_en` text NOT NULL,
	`title_ja` text NOT NULL,
	`excerpt_en` text DEFAULT '' NOT NULL,
	`excerpt_ja` text DEFAULT '' NOT NULL,
	`body_en` text DEFAULT '' NOT NULL,
	`body_ja` text DEFAULT '' NOT NULL,
	`hero_image` text NOT NULL,
	`category` text DEFAULT 'grill' NOT NULL,
	`cook_time_minutes` integer DEFAULT 30 NOT NULL,
	`difficulty` text DEFAULT 'easy' NOT NULL,
	`servings` integer DEFAULT 2 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_slug_unique` ON `recipes` (`slug`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_name` text DEFAULT 'system' NOT NULL,
	`action` text NOT NULL,
	`target_type` text DEFAULT '' NOT NULL,
	`target_id` text DEFAULT '' NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('now','subsec')*1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipping_zones` (
	`id` text PRIMARY KEY NOT NULL,
	`prefecture` text NOT NULL,
	`base_fee_jpy` integer DEFAULT 1200 NOT NULL,
	`surcharge_jpy` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shipping_zones_prefecture_unique` ON `shipping_zones` (`prefecture`);