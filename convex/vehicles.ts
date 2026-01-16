import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const listVehicles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    return await ctx.db
      .query("vehicles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const createVehicle = mutation({
  args: {
    plateNumber: v.string(),
    model: v.string(),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userRole?.role !== "admin") {
      throw new Error("管理者権限が必要です");
    }

    return await ctx.db.insert("vehicles", {
      ...args,
      isActive: true,
    });
  },
});
