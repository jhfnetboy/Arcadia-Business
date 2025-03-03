/*
 Navicat Premium Data Transfer

 Source Server         : arcadia
 Source Server Type    : PostgreSQL
 Source Server Version : 150001 (150001)
 Source Host           : localhost:5432
 Source Catalog        : coupon_db
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 150001 (150001)
 File Encoding         : 65001

 Date: 03/03/2025 11:29:14
*/


-- ----------------------------
-- Table structure for _prisma_migrations
-- ----------------------------
DROP TABLE IF EXISTS "public"."_prisma_migrations";
CREATE TABLE "public"."_prisma_migrations" (
  "id" varchar(36) COLLATE "pg_catalog"."default" NOT NULL,
  "checksum" varchar(64) COLLATE "pg_catalog"."default" NOT NULL,
  "finished_at" timestamptz(6),
  "migration_name" varchar(255) COLLATE "pg_catalog"."default" NOT NULL,
  "logs" text COLLATE "pg_catalog"."default",
  "rolled_back_at" timestamptz(6),
  "started_at" timestamptz(6) NOT NULL DEFAULT now(),
  "applied_steps_count" int4 NOT NULL DEFAULT 0
)
;
ALTER TABLE "public"."_prisma_migrations" OWNER TO "postgres";

-- ----------------------------
-- Records of _prisma_migrations
-- ----------------------------
BEGIN;
INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES ('a93e03a6-6609-4739-8889-2393443dcd5a', '608312ec75f47bcc92d3fc8d91db7e0678bed0e73e467a0118904d39563c048d', '2025-01-20 19:06:26.009503+08', '20250120110625_init', NULL, NULL, '2025-01-20 19:06:25.921713+08', 1);
COMMIT;

-- ----------------------------
-- Table structure for accounts
-- ----------------------------
DROP TABLE IF EXISTS "public"."accounts";
CREATE TABLE "public"."accounts" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "type" text COLLATE "pg_catalog"."default" NOT NULL,
  "provider" text COLLATE "pg_catalog"."default" NOT NULL,
  "provider_account_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "refresh_token" text COLLATE "pg_catalog"."default",
  "access_token" text COLLATE "pg_catalog"."default",
  "expires_at" int4,
  "token_type" text COLLATE "pg_catalog"."default",
  "scope" text COLLATE "pg_catalog"."default",
  "id_token" text COLLATE "pg_catalog"."default",
  "session_state" text COLLATE "pg_catalog"."default"
)
;
ALTER TABLE "public"."accounts" OWNER TO "postgres";

-- ----------------------------
-- Records of accounts
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for coupon_categories
-- ----------------------------
DROP TABLE IF EXISTS "public"."coupon_categories";
CREATE TABLE "public"."coupon_categories" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "public"."coupon_categories" OWNER TO "postgres";

-- ----------------------------
-- Records of coupon_categories
-- ----------------------------
BEGIN;
INSERT INTO "public"."coupon_categories" ("id", "name", "description", "created_at") VALUES ('cm64ycr980000dlycezbotkjm', 'Food & Beverage', 'Restaurants, cafes, and food delivery services', '2025-01-20 11:17:50.972');
INSERT INTO "public"."coupon_categories" ("id", "name", "description", "created_at") VALUES ('cm64ycr9j0001dlycbb0ccmjg', 'Shopping', 'Retail stores and online shopping', '2025-01-20 11:17:50.984');
INSERT INTO "public"."coupon_categories" ("id", "name", "description", "created_at") VALUES ('cm64ycr9l0002dlycv3cjolmj', 'Entertainment', 'Movies, games, and leisure activities', '2025-01-20 11:17:50.986');
INSERT INTO "public"."coupon_categories" ("id", "name", "description", "created_at") VALUES ('cm64ycr9n0003dlycxkzu0j9o', 'Travel', 'Hotels, flights, and travel packages', '2025-01-20 11:17:50.987');
INSERT INTO "public"."coupon_categories" ("id", "name", "description", "created_at") VALUES ('cm64ycr9p0004dlyczi2yj9is', 'Beauty & Wellness', 'Spas, salons, and wellness centers', '2025-01-20 11:17:50.989');
INSERT INTO "public"."coupon_categories" ("id", "name", "description", "created_at") VALUES ('cm64ycr9q0005dlycwakjl1dh', 'Services', 'Professional and personal services', '2025-01-20 11:17:50.991');
COMMIT;

-- ----------------------------
-- Table structure for coupon_templates
-- ----------------------------
DROP TABLE IF EXISTS "public"."coupon_templates";
CREATE TABLE "public"."coupon_templates" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "merchant_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "category_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "discount_type" text COLLATE "pg_catalog"."default" NOT NULL,
  "discount_value" numeric(65,30) NOT NULL,
  "total_quantity" int4 NOT NULL,
  "remaining_quantity" int4 NOT NULL,
  "start_date" timestamp(3) NOT NULL,
  "end_date" timestamp(3) NOT NULL,
  "status" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'active'::text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "settings" jsonb NOT NULL,
  "publish_price" int4 NOT NULL,
  "sell_price" int4 NOT NULL DEFAULT 30,
  "promotion_type" text COLLATE "pg_catalog"."default" NOT NULL
)
;
ALTER TABLE "public"."coupon_templates" OWNER TO "postgres";

-- ----------------------------
-- Records of coupon_templates
-- ----------------------------
BEGIN;
INSERT INTO "public"."coupon_templates" ("id", "merchant_id", "category_id", "name", "description", "discount_type", "discount_value", "total_quantity", "remaining_quantity", "start_date", "end_date", "status", "created_at", "settings", "publish_price", "sell_price", "promotion_type") VALUES ('cm65031j60001dlmnnb0ua6l3', 'cm64yc5mk0002dls1c3a1ppyv', 'cm64ycr9n0003dlycxkzu0j9o', 'Coupon 2', '水电费', 'percentage', 15.000000000000002000000000000000, 3, 2, '2025-01-21 06:00:00', '2025-02-04 06:00:00', 'active', '2025-01-20 12:06:16.955', '{"num": 0.85, "affect": "price", "payNum": null, "payType": null, "calculate": "multi", "condition": null, "timeLimit": false, "requirePeopleNum": null}', 135, 30, 'AMAZON_PERCENTAGE_OFF');
INSERT INTO "public"."coupon_templates" ("id", "merchant_id", "category_id", "name", "description", "discount_type", "discount_value", "total_quantity", "remaining_quantity", "start_date", "end_date", "status", "created_at", "settings", "publish_price", "sell_price", "promotion_type") VALUES ('cm6534ofv000fdlmnxm64o66j', 'cm64yc5mk0002dls1c3a1ppyv', 'cm64ycr9j0001dlycbb0ccmjg', 'Coupon 2', '快快快', 'fixed', 20.000000000000000000000000000000, 10, 9, '2025-01-20 15:00:00', '2025-02-04 10:00:00', 'active', '2025-01-20 13:31:32.155', '{"num": 20, "affect": "price", "payNum": null, "payType": null, "calculate": "subtract", "condition": null, "timeLimit": false, "requirePeopleNum": null}', 300, 30, 'PINDUODUO_DIRECT_REDUCTION');
INSERT INTO "public"."coupon_templates" ("id", "merchant_id", "category_id", "name", "description", "discount_type", "discount_value", "total_quantity", "remaining_quantity", "start_date", "end_date", "status", "created_at", "settings", "publish_price", "sell_price", "promotion_type") VALUES ('cm6539teb000jdlmn1ex4s830', 'cm64yc5mk0002dls1c3a1ppyv', 'cm64ycr9n0003dlycxkzu0j9o', 'Coupon 3', '快快快三十三', 'fixed', 10.000000000000000000000000000000, 15, 14, '2025-01-22 10:00:00', '2025-02-04 10:00:00', 'active', '2025-01-20 13:35:31.86', '{"num": 10, "affect": "price", "payNum": 100, "payType": "points", "calculate": "subtract", "condition": null, "timeLimit": false, "requirePeopleNum": null}', 525, 30, 'TAOBAO_COUPON');
INSERT INTO "public"."coupon_templates" ("id", "merchant_id", "category_id", "name", "description", "discount_type", "discount_value", "total_quantity", "remaining_quantity", "start_date", "end_date", "status", "created_at", "settings", "publish_price", "sell_price", "promotion_type") VALUES ('cm655ugge0001hny5vf3w1r2a', 'cm64yc5mk0002dls1c3a1ppyv', 'cm64ycr9l0002dlycv3cjolmj', '过期测试', 'Expire date time test', 'percentage', 30.000000000000000000000000000000, 1, 1, '2025-01-20 15:46:00', '2025-01-20 22:46:00', 'active', '2025-01-20 14:47:34.09', '{"num": 0.7, "affect": "price", "payNum": null, "payType": null, "calculate": "multi", "condition": null, "timeLimit": false, "requirePeopleNum": 3}', 50, 30, 'PINDUODUO_GROUP_BUYING');
INSERT INTO "public"."coupon_templates" ("id", "merchant_id", "category_id", "name", "description", "discount_type", "discount_value", "total_quantity", "remaining_quantity", "start_date", "end_date", "status", "created_at", "settings", "publish_price", "sell_price", "promotion_type") VALUES ('cm67f4d320001dla4t0crspao', 'cm64yc5mk0002dls1c3a1ppyv', 'cm64ycr9p0004dlyczi2yj9is', 'Coupon 4', 'test for now', 'percentage', 30.000000000000000000000000000000, 10, 9, '2025-01-23 09:42:00', '2025-02-07 09:42:00', 'active', '2025-01-22 04:42:45.18', '{"num": 0.7, "affect": "price", "payNum": null, "payType": null, "calculate": "multi", "condition": null, "timeLimit": false, "requirePeopleNum": 3}', 500, 30, 'PINDUODUO_GROUP_BUYING');
COMMIT;

-- ----------------------------
-- Table structure for issued_coupons
-- ----------------------------
DROP TABLE IF EXISTS "public"."issued_coupons";
CREATE TABLE "public"."issued_coupons" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "template_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "pass_code" text COLLATE "pg_catalog"."default" NOT NULL,
  "qr_code" text COLLATE "pg_catalog"."default",
  "status" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'unused'::text,
  "used_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "buy_price" int4 NOT NULL
)
;
ALTER TABLE "public"."issued_coupons" OWNER TO "postgres";

-- ----------------------------
-- Records of issued_coupons
-- ----------------------------
BEGIN;
INSERT INTO "public"."issued_coupons" ("id", "template_id", "user_id", "pass_code", "qr_code", "status", "used_at", "created_at", "buy_price") VALUES ('cm652hofx000ddlmn27ijvmit', 'cm65031j60001dlmnnb0ua6l3', 'cm64yady00000dls1deg9qbx6', 'KH8QE70U', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAK7SURBVO3BQW7sWAwEwSxC979yjpdcPUCQur/NYUT8wRqjWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoFw8l4ZtUuiR0Kl0SOpU7kvBNKk8Ua5RijVKsUS5epvKmJNyRhE7lJAmdyonKm5LwpmKNUqxRijXKxYcl4Q6VO1S6JHxTEu5Q+aRijVKsUYo1ysUfl4STJPyfFGuUYo1SrFEu/jiVLgknKpMVa5RijVKsUS4+TOVfUvkkld+kWKMUa5RijXLxsiR8UxI6lS4JnUqXhE7lJAm/WbFGKdYoxRrl4iGVv0zlROUvKdYoxRqlWKNcPJSETqVLwolKl4Q7VLokdCpPJKFTOUlCp9Il4UTliWKNUqxRijVK/MEDSehU7khCp/KmJHQqXRI6lZMkdConSThReVOxRinWKMUa5eLDktCpdConSehUuiS8KQl3JKFTuSMJncoTxRqlWKMUa5SLh1ROVLok3KHyhMoTKk+ofFOxRinWKMUa5eKhJHQqJyp3JKFT6VS6JJwkoVPpknBHEjqVLgmdSpeETuWJYo1SrFGKNUr8wR+WhBOVO5LQqbwpCZ3Km4o1SrFGKdYoFw8l4ZtU7khCp3JHEjqVLgmdyr9UrFGKNUqxRrl4mcqbknCHykkSnkhCp3KHyicVa5RijVKsUS4+LAl3qNyh0iXhDpWTJHQqTyThROWJYo1SrFGKNcrFH5eEO1ROktCpdEnoVLok3KHypmKNUqxRijXKxTAqXRK6JHQqd6h0SThR+aZijVKsUYo1ysWHqXySSpeETqVLQpeETqVLQqfSqfwmxRqlWKMUa5SLlyXhm5LQqbxJ5SQJncpJEjqVNxVrlGKNUqxR4g/WGMUapVijFGuUYo1SrFGKNUqxRinWKMUapVijFGuUYo1SrFGKNUqxRvkPb9EY5mOVjDUAAAAASUVORK5CYII=', 'used', '2025-01-20 13:14:32.065', '2025-01-20 13:13:39.066', 30);
INSERT INTO "public"."issued_coupons" ("id", "template_id", "user_id", "pass_code", "qr_code", "status", "used_at", "created_at", "buy_price") VALUES ('cm653htoz000tdlmnb9e1baly', 'cm6539teb000jdlmn1ex4s830', 'cm64yady00000dls1deg9qbx6', 'POXNWPQW', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAAK+SURBVO3BQY7cQAwEwSxC//9yeo88NSBIM/bSjIg/WGMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRrl4qEkfJNKl4QTlSeS8E0qTxRrlGKNUqxRLl6m8qYknKicJKFT6ZLQqZyovCkJbyrWKMUapVijXHxYEu5QuSMJJyqflIQ7VD6pWKMUa5RijXLxy6l0SeiS0KlMVqxRijVKsUa5GE7lf1KsUYo1SrFGufgwlU9KQqfSJaFT6VSeUPmXFGuUYo1SrFEuXpaE3yQJncpJEv5lxRqlWKMUa5T4g0GS0Kl0SehUJinWKMUapVijXDyUhE6lS0KnckcSTlSeSEKncpKETuUkCZ1Kl4RO5YlijVKsUYo1ysWXJeFEpVM5SUKn0iWhU3lC5YkkdCpvKtYoxRqlWKNcPKTSJeFE5SQJJyonSXhTEjqVO1S+qVijFGuUYo0Sf/BAEjqVLgknKm9KwolKl4RO5Y4kvEnliWKNUqxRijVK/MFflIROpUtCp9IloVPpktCp3JGETuUkCScqXRI6lSeKNUqxRinWKBd/mcqJypuS0Kl0SXhCpUvCicqbijVKsUYp1igXDyXhm1TelIQTlS4JJyp3JKFTeaJYoxRrlGKNcvEylTcl4USlS0Kn0iWhU+mS0CWhUzlJQqdyovKmYo1SrFGKNcrFhyXhDpVvSsIdSXhTEjqVJ4o1SrFGKdYoF8OodEnoVJ5IQqfSJaFLQqfSqbypWKMUa5RijXLxyyWhU+lUnkjCEypdEk5UnijWKMUapVijXHyYyiepnCShU+mS0Kl0Kl0SnlDpkvCmYo1SrFGKNcrFy5LwTUnoVO5QOUlCp9Il4Y4kfFKxRinWKMUaJf5gjVGsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5Q/Clcc6FkP1p8AAAAASUVORK5CYII=', 'unused', NULL, '2025-01-20 13:41:45.49', 30);
INSERT INTO "public"."issued_coupons" ("id", "template_id", "user_id", "pass_code", "qr_code", "status", "used_at", "created_at", "buy_price") VALUES ('cm653hii0000pdlmnzcjfnn42', 'cm6534ofv000fdlmnxm64o66j', 'cm64yady00000dls1deg9qbx6', 'GR5VVD56', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAALPSURBVO3BQa7jSAwFwXyE7n/lHC+5KkCQbMxnMyJ+sMYo1ijFGqVYoxRrlGKNUqxRijVKsUYp1ijFGqVYoxRrlGKNUqxRijXKxUNJ+CWVO5LQqdyRhF9SeaJYoxRrlGKNcvEylTcl4SQJv6TypiS8qVijFGuUYo1y8WVJuEPlDpWTJHxTEu5Q+aZijVKsUYo1ysU/JgknKn9ZsUYp1ijFGuXij0tCp/IvK9YoxRqlWKNcfJnKN6l0SbhD5QmV/5NijVKsUYo1ysXLkvBLSehUuiR0Kl0SOpWTJPyfFWuUYo1SrFHiB2uMYo1SrFGKNcrFQ0noVLokdCpdEjqVLgmdykkSTlS6JHQqdyShUzlJQqfypmKNUqxRijXKxcuS8EQSOpWTJHQqJ0noVLokdCpdEjqVLgmdSqfSJaFTeaJYoxRrlGKNcvGQSpeETuWJJJyonCThiSTcoXKHypuKNUqxRinWKPGDL0rCHSonSThROUnCHSpdEu5Q6ZJwovJEsUYp1ijFGuXiZUnoVLokdConSThR6ZLQqZyodEnoknCicpKEE5U3FWuUYo1SrFHiB39YEu5QuSMJJypdEjqVLgknKk8Ua5RijVKsUeIHDyThl1ROktCpnCShU7kjCXeodEnoVJ4o1ijFGqVYo1y8TOVNSbhDpUtCp9KpnCThROWOJHQqbyrWKMUapVijXHxZEu5QuSMJJyonSehUTlTelIRO5YlijVKsUYo1ysUfp9Il4SQJnUqXhE7lJAknKicqbyrWKMUapVijXPxxSfimJHQqJypdEjqVLgmdyhPFGqVYoxRrlIsvU/kmlS4JXRJOknCickcSOpUuCd9UrFGKNUqxRrl4WRJ+KQmdykkSOpUuCV0S7lDpktCpdEl4U7FGKdYoxRolfrDGKNYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1yn+/KB35c/f7HAAAAABJRU5ErkJggg==', 'used', '2025-01-22 04:43:45.258', '2025-01-20 13:41:30.983', 30);
INSERT INTO "public"."issued_coupons" ("id", "template_id", "user_id", "pass_code", "qr_code", "status", "used_at", "created_at", "buy_price") VALUES ('cm67f6ieq0007dla4ahn3srd4', 'cm67f4d320001dla4t0crspao', 'cm64yady00000dls1deg9qbx6', 'UDS6HSV5', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHQAAAB0CAYAAABUmhYnAAAAAklEQVR4AewaftIAAALJSURBVO3BQW7kQAwEwSxC//9yro88NSBIM7C5jIg/WGMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFGKdYoxRrl4qEkfJPKSRKeUOmS8E0qTxRrlGKNUqxRLl6m8qYknCThRKVLwhMqb0rCm4o1SrFGKdYoFx+WhDtU7lDpktAloVN5UxLuUPmkYo1SrFGKNcrFfyYJncokxRqlWKMUa5SLPy4JnUqXhJMkdCp/WbFGKdYoxRrl4sNUPkmlS0Kn0iWhU3lC5Tcp1ijFGqVYo1y8LAnflIROpUtCp9IloVM5ScJvVqxRijVKsUaJPxgsCZ3KZMUapVijFGuUi4eS0Kl0SehUuiR0Kl0SOpU7VE6S0KnckYRO5SQJncqbijVKsUYp1igXD6nckYQ7VLokdCpdEu5Q6ZLQqXRJ6FS6JJyodEnoVJ4o1ijFGqVYo1y8LAmdykkSuiTckYQTlS4JdyThLynWKMUapVijxB88kIROpUtCp3KShE6lS8I3qXRJOFHpktCpfFKxRinWKMUaJf7gF0nCN6l0SbhD5Y4knKg8UaxRijVKsUaJP/jDknCHyh1JOFH5TYo1SrFGKdYoFw8l4ZtUOpWTJJwkoVPpVE6S0Kl0SbhD5YlijVKsUYo1ysXLVN6UhCdUTlROknCi8oTKm4o1SrFGKdYoFx+WhDtU7khCp3JHEjqVE5UuCZ3KHUnoVJ4o1ijFGqVYo1z8cSpdEjqVLgmdSpeETqVLQqdyotIloVN5U7FGKdYoxRrl4o9LQqfypiS8SaVLQqfyRLFGKdYoxRrl4sNUPknlJAknSThROUlCp3KShE8q1ijFGqVYo1y8LAnflIQTlS4JnUqXhC4JnUqncodKl4Q3FWuUYo1SrFHiD9YYxRqlWKMUa5RijVKsUYo1SrFGKdYoxRqlWKMUa5RijVKsUYo1SrFG+QcL/B3zYtT9+wAAAABJRU5ErkJggg==', 'unused', NULL, '2025-01-22 04:44:25.394', 30);
COMMIT;

-- ----------------------------
-- Table structure for merchant_profiles
-- ----------------------------
DROP TABLE IF EXISTS "public"."merchant_profiles";
CREATE TABLE "public"."merchant_profiles" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "business_name" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "address" text COLLATE "pg_catalog"."default",
  "location" jsonb,
  "images" text[] COLLATE "pg_catalog"."default",
  "points_balance" int4 NOT NULL DEFAULT 0,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "public"."merchant_profiles" OWNER TO "postgres";

-- ----------------------------
-- Records of merchant_profiles
-- ----------------------------
BEGIN;
INSERT INTO "public"."merchant_profiles" ("id", "user_id", "business_name", "description", "address", "location", "images", "points_balance", "created_at", "updated_at") VALUES ('cm64yc5mk0002dls1c3a1ppyv', 'cm64yady00000dls1deg9qbx6', 'ZuCoffee', 'Test', '4 Nimmana Haeminda Rd Lane 13, Tambon Su Thep, Amphoe Mueang Chiang Mai, Chang Wat Chiang Mai 50200, Thailand', '{"lat": 18.79634427108842, "lng": 98.96847718505857}', '{/uploads/1737371842929-q535euc79ha.jpg,/uploads/1737371842930-3mr1wojmi7.jpg,/uploads/1737371842930-wemjy1zy0o.jpg}', 490, '2025-01-20 11:17:22.938', '2025-01-22 04:42:45.18');
COMMIT;

-- ----------------------------
-- Table structure for player_profiles
-- ----------------------------
DROP TABLE IF EXISTS "public"."player_profiles";
CREATE TABLE "public"."player_profiles" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "wallet_address" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "points_balance" int4 NOT NULL DEFAULT 0
)
;
ALTER TABLE "public"."player_profiles" OWNER TO "postgres";

-- ----------------------------
-- Records of player_profiles
-- ----------------------------
BEGIN;
INSERT INTO "public"."player_profiles" ("id", "user_id", "wallet_address", "created_at", "updated_at", "points_balance") VALUES ('cm6503l5r0005dlmnm8st2psd', 'cm64yady00000dls1deg9qbx6', '0xe24b6f321B0140716a2b671ed0D983bb64E7DaFA', '2025-01-20 12:06:42.4', '2025-01-22 04:44:25.394', 1880);
COMMIT;

-- ----------------------------
-- Table structure for promotion_types
-- ----------------------------
DROP TABLE IF EXISTS "public"."promotion_types";
CREATE TABLE "public"."promotion_types" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "type" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "basePoints" int4 NOT NULL,
  "affect" text COLLATE "pg_catalog"."default" NOT NULL,
  "calculate" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default" NOT NULL,
  "defaultNum" float8,
  "requirePeopleNum" int4,
  "condition" int4,
  "timeLimit" bool NOT NULL DEFAULT false,
  "payType" text COLLATE "pg_catalog"."default",
  "payNum" int4,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL
)
;
ALTER TABLE "public"."promotion_types" OWNER TO "postgres";

-- ----------------------------
-- Records of promotion_types
-- ----------------------------
BEGIN;
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfoe0000dl33yb2i6dcj', 'PINDUODUO_GROUP_BUYING', 'Group Buying', 50, 'price', 'multi', 'Get discount when multiple people join the group purchase', 0.7, 3, NULL, 'f', NULL, NULL, '2025-01-20 11:06:42.783', '2025-01-20 11:50:32.311');
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfol0001dl33iocutrcl', 'PINDUODUO_DIRECT_REDUCTION', 'Direct Discount', 30, 'price', 'subtract', 'Direct amount reduction from original price', 20, NULL, NULL, 'f', NULL, NULL, '2025-01-20 11:06:42.789', '2025-01-20 11:50:32.318');
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfoo0002dl33zhggc5qq', 'TAOBAO_FULL_MINUS', 'Spend More Save More', 40, 'total_order', 'subtract', 'Get fixed amount off when order meets minimum spend', 50, NULL, 200, 'f', NULL, NULL, '2025-01-20 11:06:42.792', '2025-01-20 11:50:32.321');
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfor0003dl33f71hi4pm', 'TAOBAO_COUPON', 'Store Coupon', 35, 'price', 'subtract', 'Exchange points for store coupon', 10, NULL, NULL, 'f', 'points', 100, '2025-01-20 11:06:42.795', '2025-01-20 11:50:32.323');
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfou0004dl33ntsrmwp3', 'AMAZON_PERCENTAGE_OFF', 'Percentage Discount', 45, 'price', 'multi', 'Get percentage off original price', 0.85, NULL, NULL, 'f', NULL, NULL, '2025-01-20 11:06:42.798', '2025-01-20 11:50:32.326');
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfow0005dl33npbjrtua', 'AMAZON_BUNDLE_SALE', 'Bundle Discount', 55, 'total_order', 'multi', 'Get discount when buying multiple items', 0.9, NULL, 2, 'f', NULL, NULL, '2025-01-20 11:06:42.8', '2025-01-20 11:50:32.328');
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfoy0006dl33v6pvh87h', 'EBAY_DAILY_DEAL', 'Time-Limited Deal', 60, 'price', 'multi', 'Special discount during limited time period', 0.6, NULL, NULL, 't', NULL, NULL, '2025-01-20 11:06:42.802', '2025-01-20 11:50:32.331');
INSERT INTO "public"."promotion_types" ("id", "type", "name", "basePoints", "affect", "calculate", "description", "defaultNum", "requirePeopleNum", "condition", "timeLimit", "payType", "payNum", "created_at", "updated_at") VALUES ('cm64xyfp10007dl33fvb6h0ec', 'EBAY_COUPON_CODE', 'Coupon Code', 40, 'total_order', 'subtract', 'Use special code to get discount', 15, NULL, NULL, 'f', 'points', NULL, '2025-01-20 11:06:42.805', '2025-01-20 11:50:32.333');
COMMIT;

-- ----------------------------
-- Table structure for recharge_codes
-- ----------------------------
DROP TABLE IF EXISTS "public"."recharge_codes";
CREATE TABLE "public"."recharge_codes" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "code" text COLLATE "pg_catalog"."default" NOT NULL,
  "points" int4 NOT NULL,
  "merchant_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "status" text COLLATE "pg_catalog"."default" NOT NULL DEFAULT 'unused'::text,
  "used_at" timestamp(3),
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
)
;
ALTER TABLE "public"."recharge_codes" OWNER TO "postgres";

-- ----------------------------
-- Records of recharge_codes
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sessions
-- ----------------------------
DROP TABLE IF EXISTS "public"."sessions";
CREATE TABLE "public"."sessions" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "session_token" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "expires" timestamp(3) NOT NULL
)
;
ALTER TABLE "public"."sessions" OWNER TO "postgres";

-- ----------------------------
-- Records of sessions
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for transactions
-- ----------------------------
DROP TABLE IF EXISTS "public"."transactions";
CREATE TABLE "public"."transactions" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "user_id" text COLLATE "pg_catalog"."default" NOT NULL,
  "type" text COLLATE "pg_catalog"."default" NOT NULL,
  "amount" int4 NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" text COLLATE "pg_catalog"."default" NOT NULL,
  "updated_at" timestamp(3) NOT NULL,
  "coupon_id" text COLLATE "pg_catalog"."default",
  "quantity" int4 NOT NULL DEFAULT 1
)
;
ALTER TABLE "public"."transactions" OWNER TO "postgres";

-- ----------------------------
-- Records of transactions
-- ----------------------------
BEGIN;
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm64yhbxk0001dl5h0yl0go5i', 'cm64yady00000dls1deg9qbx6', 'recharge', 1000, '2025-01-20 11:21:24.389', 'completed', '2025-01-20 11:21:24.389', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm65031j90003dlmnbwj0bqg4', 'cm64yady00000dls1deg9qbx6', 'coupon_creation', -135, '2025-01-20 12:06:16.955', 'completed', '2025-01-20 12:06:16.955', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm65042yr0001dlal0zhs878s', 'cm64yady00000dls1deg9qbx6', 'points_recharge', 1000, '2025-01-20 12:07:05.469', 'completed', '2025-01-20 12:07:05.469', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm652hofx000bdlmnfnr8y1pa', 'cm64yady00000dls1deg9qbx6', 'buy_coupon', -30, '2025-01-20 13:13:39.066', 'completed', '2025-01-20 13:13:39.066', 'cm65031j60001dlmnnb0ua6l3', 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm652q88z0001448k4bxhr669', 'cm64yady00000dls1deg9qbx6', 'points_recharge', 1000, '2025-01-20 13:20:17.984', 'completed', '2025-01-20 13:20:17.984', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm652qgi4000144bv39pkn34g', 'cm64yady00000dls1deg9qbx6', 'recharge', 1000, '2025-01-20 13:20:28.683', 'completed', '2025-01-20 13:20:28.683', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm6531zwh000144qgta77j13j', 'cm64yady00000dls1deg9qbx6', 'recharge_points', 1865, '2025-01-20 13:29:27.039', 'completed', '2025-01-20 13:29:27.042', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm6531zwk000344qg2bsqyjxt', 'cm64yady00000dls1deg9qbx6', 'recharge_points', 1970, '2025-01-20 13:29:27.044', 'completed', '2025-01-20 13:29:27.045', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm6534ofw000hdlmnhe3awdv7', 'cm64yady00000dls1deg9qbx6', 'coupon_creation', -300, '2025-01-20 13:31:32.155', 'completed', '2025-01-20 13:31:32.155', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm6539tec000ldlmnt1l7o66d', 'cm64yady00000dls1deg9qbx6', 'coupon_creation', -525, '2025-01-20 13:35:31.86', 'completed', '2025-01-20 13:35:31.86', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm653hihz000ndlmnl93534x7', 'cm64yady00000dls1deg9qbx6', 'buy_coupon', -30, '2025-01-20 13:41:30.983', 'completed', '2025-01-20 13:41:30.983', 'cm6534ofv000fdlmnxm64o66j', 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm653htoy000rdlmn1s8x89wi', 'cm64yady00000dls1deg9qbx6', 'buy_coupon', -30, '2025-01-20 13:41:45.49', 'completed', '2025-01-20 13:41:45.49', 'cm6539teb000jdlmn1ex4s830', 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm655uggg0003hny5rjmr45a8', 'cm64yady00000dls1deg9qbx6', 'coupon_creation', -50, '2025-01-20 14:47:34.09', 'completed', '2025-01-20 14:47:34.09', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm67f4d330003dla4jbxybzxl', 'cm64yady00000dls1deg9qbx6', 'coupon_creation', -500, '2025-01-22 04:42:45.18', 'completed', '2025-01-22 04:42:45.18', NULL, 1);
INSERT INTO "public"."transactions" ("id", "user_id", "type", "amount", "created_at", "status", "updated_at", "coupon_id", "quantity") VALUES ('cm67f6ieq0005dla40otbwb2e', 'cm64yady00000dls1deg9qbx6', 'buy_coupon', -30, '2025-01-22 04:44:25.394', 'completed', '2025-01-22 04:44:25.394', 'cm67f4d320001dla4t0crspao', 1);
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS "public"."users";
CREATE TABLE "public"."users" (
  "id" text COLLATE "pg_catalog"."default" NOT NULL,
  "email" text COLLATE "pg_catalog"."default" NOT NULL,
  "name" text COLLATE "pg_catalog"."default",
  "image" text COLLATE "pg_catalog"."default",
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  "email_verified" timestamp(3)
)
;
ALTER TABLE "public"."users" OWNER TO "postgres";

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO "public"."users" ("id", "email", "name", "image", "created_at", "updated_at", "email_verified") VALUES ('cm64yady00000dls1deg9qbx6', 'jhfnetboy@gmail.com', 'Netboy Jhf', 'https://lh3.googleusercontent.com/a/ACg8ocJIChqKtZqSs5JxWZSW-J5kx2iGpfmPeoke2xhufgKp7sPxcxMS=s96-c', '2025-01-20 11:16:00.409', '2025-01-20 11:16:00.409', NULL);
COMMIT;

-- ----------------------------
-- Table structure for verification_tokens
-- ----------------------------
DROP TABLE IF EXISTS "public"."verification_tokens";
CREATE TABLE "public"."verification_tokens" (
  "identifier" text COLLATE "pg_catalog"."default" NOT NULL,
  "token" text COLLATE "pg_catalog"."default" NOT NULL,
  "expires" timestamp(3) NOT NULL
)
;
ALTER TABLE "public"."verification_tokens" OWNER TO "postgres";

-- ----------------------------
-- Records of verification_tokens
-- ----------------------------
BEGIN;
COMMIT;

-- Primary Key structure for table _prisma_migrations
-- ----------------------------
ALTER TABLE "public"."_prisma_migrations" ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table accounts
-- ----------------------------
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts" USING btree (
  "provider" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "provider_account_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table accounts
-- ----------------------------
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table coupon_categories
-- ----------------------------
CREATE UNIQUE INDEX "coupon_categories_name_key" ON "public"."coupon_categories" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table coupon_categories
-- ----------------------------
ALTER TABLE "public"."coupon_categories" ADD CONSTRAINT "coupon_categories_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table coupon_templates
-- ----------------------------
ALTER TABLE "public"."coupon_templates" ADD CONSTRAINT "coupon_templates_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table issued_coupons
-- ----------------------------
CREATE UNIQUE INDEX "issued_coupons_pass_code_key" ON "public"."issued_coupons" USING btree (
  "pass_code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table issued_coupons
-- ----------------------------
ALTER TABLE "public"."issued_coupons" ADD CONSTRAINT "issued_coupons_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table merchant_profiles
-- ----------------------------
CREATE UNIQUE INDEX "merchant_profiles_user_id_key" ON "public"."merchant_profiles" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table merchant_profiles
-- ----------------------------
ALTER TABLE "public"."merchant_profiles" ADD CONSTRAINT "merchant_profiles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table player_profiles
-- ----------------------------
CREATE UNIQUE INDEX "player_profiles_user_id_key" ON "public"."player_profiles" USING btree (
  "user_id" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "player_profiles_wallet_address_key" ON "public"."player_profiles" USING btree (
  "wallet_address" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table player_profiles
-- ----------------------------
ALTER TABLE "public"."player_profiles" ADD CONSTRAINT "player_profiles_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table promotion_types
-- ----------------------------
CREATE UNIQUE INDEX "promotion_types_type_key" ON "public"."promotion_types" USING btree (
  "type" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table promotion_types
-- ----------------------------
ALTER TABLE "public"."promotion_types" ADD CONSTRAINT "promotion_types_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table recharge_codes
-- ----------------------------
CREATE UNIQUE INDEX "recharge_codes_code_key" ON "public"."recharge_codes" USING btree (
  "code" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table recharge_codes
-- ----------------------------
ALTER TABLE "public"."recharge_codes" ADD CONSTRAINT "recharge_codes_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table sessions
-- ----------------------------
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions" USING btree (
  "session_token" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table sessions
-- ----------------------------
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Primary Key structure for table transactions
-- ----------------------------
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table users
-- ----------------------------
CREATE UNIQUE INDEX "users_email_key" ON "public"."users" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table users
-- ----------------------------
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table verification_tokens
-- ----------------------------
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens" USING btree (
  "identifier" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST,
  "token" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens" USING btree (
  "token" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Foreign Keys structure for table accounts
-- ----------------------------
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table coupon_templates
-- ----------------------------
ALTER TABLE "public"."coupon_templates" ADD CONSTRAINT "coupon_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."coupon_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."coupon_templates" ADD CONSTRAINT "coupon_templates_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."coupon_templates" ADD CONSTRAINT "coupon_templates_promotion_type_fkey" FOREIGN KEY ("promotion_type") REFERENCES "public"."promotion_types" ("type") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table issued_coupons
-- ----------------------------
ALTER TABLE "public"."issued_coupons" ADD CONSTRAINT "issued_coupons_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."coupon_templates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."issued_coupons" ADD CONSTRAINT "issued_coupons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table merchant_profiles
-- ----------------------------
ALTER TABLE "public"."merchant_profiles" ADD CONSTRAINT "merchant_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table player_profiles
-- ----------------------------
ALTER TABLE "public"."player_profiles" ADD CONSTRAINT "player_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table recharge_codes
-- ----------------------------
ALTER TABLE "public"."recharge_codes" ADD CONSTRAINT "recharge_codes_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant_profiles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table sessions
-- ----------------------------
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ----------------------------
-- Foreign Keys structure for table transactions
-- ----------------------------
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
