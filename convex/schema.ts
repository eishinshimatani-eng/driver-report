import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // 運転手情報
  drivers: defineTable({
    userId: v.id("users"), // 認証ユーザーとの紐付け
    name: v.string(),
    licenseNumber: v.string(),
    phone: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]),

  // 車両情報
  vehicles: defineTable({
    plateNumber: v.string(),
    model: v.string(),
    capacity: v.optional(v.number()),
    isActive: v.boolean(),
  }).index("by_plate", ["plateNumber"]),

  // 日報
  dailyReports: defineTable({
    date: v.string(), // YYYY-MM-DD format
    driverId: v.id("drivers"),
    vehicleId: v.id("vehicles"),
    departureTime: v.optional(v.string()),
    returnTime: v.optional(v.string()),
    totalDistance: v.optional(v.number()),
    totalWorkingHours: v.optional(v.number()),
    status: v.union(
      v.literal("normal"),
      v.literal("trouble"),
      v.literal("accident"),
      v.literal("delay"),
      v.literal("maintenance")
    ),
    specialNotes: v.optional(v.string()),
    // 承認情報
    isApproved: v.optional(v.boolean()),
    approvedAt: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
  })
    .index("by_date", ["date"])
    .index("by_driver", ["driverId"])
    .index("by_vehicle", ["vehicleId"])
    .index("by_date_driver", ["date", "driverId"]),

  // 運行明細
  tripEntries: defineTable({
    reportId: v.id("dailyReports"),
    orderNumber: v.optional(v.string()),
    pickupLocation: v.string(),
    deliveryLocation: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    distance: v.optional(v.number()),
    waitingTime: v.optional(v.number()), // minutes
    notes: v.optional(v.string()),
    sequence: v.number(), // 順序
  }).index("by_report", ["reportId"]),

  // 添付ファイル（写真等）
  attachments: defineTable({
    reportId: v.id("dailyReports"),
    storageId: v.id("_storage"),
    filename: v.string(),
    fileType: v.string(),
    description: v.optional(v.string()),
  }).index("by_report", ["reportId"]),

  // ユーザー権限
  userRoles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("driver"), v.literal("admin")),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
