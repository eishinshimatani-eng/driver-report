import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getCurrentUserRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return userRole?.role || null;
  },
});

export const getCurrentDriver = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return driver;
  },
});

export const createUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("driver"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingRole) {
      await ctx.db.patch(existingRole._id, { role: args.role });
    } else {
      await ctx.db.insert("userRoles", args);
    }
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("driver"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    // Check if the requester is an admin
    const requesterId = await getAuthUserId(ctx);
    if (!requesterId) throw new Error("Unauthorized");

    const requesterRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", requesterId))
      .first();

    if (requesterRole?.role !== "admin") {
      throw new Error("Only admins can update user roles");
    }

    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingRole) {
      await ctx.db.patch(existingRole._id, { role: args.role });
    } else {
      await ctx.db.insert("userRoles", args);
    }
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    // Check if the requester is an admin (optional, depending on requirements, but good practice)
    const requesterId = await getAuthUserId(ctx);
    if (!requesterId) return [];

    const requesterRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", requesterId))
      .first();

    if (requesterRole?.role !== "admin") {
      return []; // Or throw error
    }

    const users = await ctx.db.query("users").collect();

    const usersWithRolesAndDrivers = await Promise.all(
      users.map(async (user) => {
        const roleRecord = await ctx.db
          .query("userRoles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        const driverRecord = await ctx.db
          .query("drivers")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          ...user,
          role: roleRecord?.role || "driver", // Default to driver if no role assigned
          driverId: driverRecord?._id,
          driverName: driverRecord?.name,
        };
      })
    );

    return usersWithRolesAndDrivers;
  },
});
