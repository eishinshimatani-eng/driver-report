import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const listDrivers = query({
  args: {},
  handler: async (ctx) => {
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

    return await ctx.db
      .query("drivers")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const createDriver = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    licenseNumber: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限チェック
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (userRole?.role !== "admin") {
      throw new Error("管理者権限が必要です");
    }

    const driverId = await ctx.db.insert("drivers", {
      ...args,
      isActive: true,
    });

    // 運転手ロールを設定
    await ctx.db.insert("userRoles", {
      userId: args.userId,
      role: "driver",
    });

    return driverId;
  },
});
