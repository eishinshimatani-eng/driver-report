import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const addTripEntry = mutation({
  args: {
    reportId: v.id("dailyReports"),
    orderNumber: v.optional(v.string()),
    pickupLocation: v.string(),
    deliveryLocation: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    distance: v.optional(v.number()),
    waitingTime: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new Error("日報が見つかりません");
    }

    // 権限チェック
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userRole?.role === "driver") {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!driver || report.driverId !== driver._id) {
        throw new Error("アクセス権限がありません");
      }
    }

    // 次のシーケンス番号を取得
    const existingEntries = await ctx.db
      .query("tripEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    const sequence = existingEntries.length + 1;

    return await ctx.db.insert("tripEntries", {
      ...args,
      sequence,
    });
  },
});

export const updateTripEntry = mutation({
  args: {
    entryId: v.id("tripEntries"),
    orderNumber: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    deliveryLocation: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    distance: v.optional(v.number()),
    waitingTime: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("運行明細が見つかりません");
    }

    const report = await ctx.db.get(entry.reportId);
    if (!report) {
      throw new Error("日報が見つかりません");
    }

    // 権限チェック
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userRole?.role === "driver") {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!driver || report.driverId !== driver._id) {
        throw new Error("アクセス権限がありません");
      }
    }

    const { entryId, ...updateData } = args;
    await ctx.db.patch(entryId, updateData);
  },
});

export const deleteTripEntry = mutation({
  args: { entryId: v.id("tripEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("運行明細が見つかりません");
    }

    const report = await ctx.db.get(entry.reportId);
    if (!report) {
      throw new Error("日報が見つかりません");
    }

    // 権限チェック
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userRole?.role === "driver") {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!driver || report.driverId !== driver._id) {
        throw new Error("アクセス権限がありません");
      }
    }

    await ctx.db.delete(args.entryId);
  },
});
