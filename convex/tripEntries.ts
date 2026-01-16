import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ヘルパー関数: 日報の合計値を再計算して更新
async function recalculateReportTotals(ctx: any, reportId: Id<"dailyReports">) {
  const entries = await ctx.db
    .query("tripEntries")
    .withIndex("by_report", (q: any) => q.eq("reportId", reportId))
    .collect();

  let totalDistance = 0;
  let totalMinutes = 0;

  for (const entry of entries) {
    // 距離の加算
    if (entry.distance) {
      totalDistance += entry.distance;
    }

    // 時間の加算
    if (entry.startTime && entry.endTime) {
      const start = parseTime(entry.startTime);
      const end = parseTime(entry.endTime);
      if (start !== null && end !== null) {
        let diff = end - start;
        if (diff < 0) {
          // 日をまたぐ場合（例：23:00 -> 01:00）は24時間加算
          diff += 24 * 60;
        }
        totalMinutes += diff;
      }
    }
  }

  const totalWorkingHours = Math.round((totalMinutes / 60) * 10) / 10; // 小数点第1位まで

  await ctx.db.patch(reportId, {
    totalDistance,
    totalWorkingHours,
  });
}

// 時刻文字列 (HH:MM) を分単位の数値に変換
function parseTime(timeStr: string): number | null {
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

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

    const newId = await ctx.db.insert("tripEntries", {
      ...args,
      sequence,
    });

    // 合計値を再計算
    await recalculateReportTotals(ctx, args.reportId);

    return newId;
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

    // 合計値を再計算
    await recalculateReportTotals(ctx, entry.reportId);
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

    // 合計値を再計算
    await recalculateReportTotals(ctx, entry.reportId);
  },
});
