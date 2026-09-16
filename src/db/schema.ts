import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Peran pengguna: petani, petugas lapangan, administrator. */
export const roleEnum = pgEnum("role", ["FARMER", "OFFICER", "ADMIN"]);

/** Tingkat keparahan serangan hama. */
export const severityEnum = pgEnum("severity_level", ["LOW", "MEDIUM", "HIGH"]);

/** Status verifikasi laporan. */
export const reportStatusEnum = pgEnum("report_status", [
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  regionName: varchar("region_name", { length: 160 }).notNull(),
  province: varchar("province", { length: 160 }).notNull().default("Jawa Timur"),
  latitude: doublePrecision("latitude").notNull().default(-7.2575),
  longitude: doublePrecision("longitude").notNull().default(112.7521),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 160 }).notNull().unique(),
    password: text("password").notNull(),
    phone: varchar("phone", { length: 32 }).notNull().default(""),
    role: roleEnum("role").notNull().default("FARMER"),
    regionId: integer("region_id").references(() => regions.id, {
      onDelete: "set null",
    }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("users_region_idx").on(table.regionId)],
);

export const pests = pgTable("pests", {
  id: serial("id").primaryKey(),
  pestName: varchar("pest_name", { length: 160 }).notNull(),
  scientificName: varchar("scientific_name", { length: 160 })
    .notNull()
    .default(""),
  description: text("description").notNull().default(""),
  symptoms: text("symptoms").notNull().default(""),
  treatmentGuide: text("treatment_guide").notNull().default(""),
  imageGuideUrl: text("image_guide_url").notNull().default(""),
  severityLevel: severityEnum("severity_level").notNull().default("MEDIUM"),
  cropTarget: varchar("crop_target", { length: 120 }).notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pestId: integer("pest_id")
      .notNull()
      .references(() => pests.id, { onDelete: "cascade" }),
    regionId: integer("region_id").references(() => regions.id, {
      onDelete: "set null",
    }),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    photoUrl: text("photo_url").notNull().default(""),
    additionalNote: text("additional_note").notNull().default(""),
    status: reportStatusEnum("status").notNull().default("PENDING"),
    verifiedBy: integer("verified_by").references(() => users.id, {
      onDelete: "set null",
    }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reports_status_idx").on(table.status),
    index("reports_pest_idx").on(table.pestId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reportId: integer("report_id").references(() => reports.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 180 }).notNull().default("Peringatan Hama"),
    message: text("message").notNull(),
    priority: severityEnum("priority").notNull().default("MEDIUM"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("notifications_user_idx").on(table.userId)],
);

export type Region = typeof regions.$inferSelect;
export type User = typeof users.$inferSelect;
export type Pest = typeof pests.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
