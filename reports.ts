import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const listReports = query({
  args: {
    paginationOpts: paginationOptsValidator,
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    driverId: v.optional(v.id("drivers")),
    vehicleId: v.optional(v.id("vehicles")),
    status: v.optional(v.string()),
    keyword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // ユーザーロールを取得
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    let results;

    // 運転手の場合は自分の日報のみ
    if (userRole?.role === "driver") {
      const driver = await ctx.db
        .query("drivers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
      
      if (!driver) {
        throw new Error("運転手情報が見つかりません");
      }
      
      results = await ctx.db
        .query("dailyReports")
        .withIndex("by_driver", (q) => q.eq("driverId", driver._id))
        .order("desc")
        .paginate(args.paginationOpts);
    } else if (args.driverId && userRole?.role === "admin") {
      results = await ctx.db
        .query("dailyReports")
        .withIndex("by_driver", (q) => q.eq("driverId", args.driverId!))
        .order("desc")
        .paginate(args.paginationOpts);
    } else if (args.vehicleId) {
      results = await ctx.db
        .query("dailyReports")
        .withIndex("by_vehicle", (q) => q.eq("vehicleId", args.vehicleId!))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db
        .query("dailyReports")
        .order("desc")
        .paginate(args.paginationOpts);
    }

    // 日付範囲フィルター
    if (args.dateFrom || args.dateTo) {
      results.page = results.page.filter((report) => {
        if (args.dateFrom && report.date < args.dateFrom) return false;
        if (args.dateTo && report.date > args.dateTo) return false;
        return true;
      });
    }

    // ステータスフィルター
    if (args.status) {
      results.page = results.page.filter((report) => report.status === args.status);
    }

    // 運転手と車両情報を付加
    const reportsWithDetails = await Promise.all(
      results.page.map(async (report) => {
        const driver = await ctx.db.get(report.driverId);
        const vehicle = await ctx.db.get(report.vehicleId);
        
        // キーワード検索（特記事項、運転手名、車両情報）
        if (args.keyword) {
          const keyword = args.keyword.toLowerCase();
          const searchText = [
            report.specialNotes || "",
            driver?.name || "",
            vehicle?.plateNumber || "",
            vehicle?.model || "",
          ].join(" ").toLowerCase();
          
          if (!searchText.includes(keyword)) {
            return null;
          }
        }

        return {
          ...report,
          driver,
          vehicle,
        };
      })
    );

    return {
      ...results,
      page: reportsWithDetails.filter(Boolean),
    };
  },
});

export const getReport = query({
  args: { reportId: v.id("dailyReports") },
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

    // 関連データを取得
    const driver = await ctx.db.get(report.driverId);
    const vehicle = await ctx.db.get(report.vehicleId);
    const tripEntries = await ctx.db
      .query("tripEntries")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    return {
      ...report,
      driver,
      vehicle,
      tripEntries: tripEntries.sort((a, b) => a.sequence - b.sequence),
      attachments,
    };
  },
});

export const createReport = mutation({
  args: {
    date: v.string(),
    vehicleId: v.id("vehicles"),
    departureTime: v.optional(v.string()),
    returnTime: v.optional(v.string()),
    status: v.union(
      v.literal("normal"),
      v.literal("trouble"),
      v.literal("accident"),
      v.literal("delay"),
      v.literal("maintenance")
    ),
    specialNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    const driver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!driver) {
      throw new Error("運転手情報が見つかりません");
    }

    // 同日の日報が既に存在するかチェック
    const existingReport = await ctx.db
      .query("dailyReports")
      .withIndex("by_date_driver", (q) => 
        q.eq("date", args.date).eq("driverId", driver._id)
      )
      .first();

    if (existingReport) {
      throw new Error("この日付の日報は既に存在します");
    }

    return await ctx.db.insert("dailyReports", {
      ...args,
      driverId: driver._id,
      totalDistance: 0,
      totalWorkingHours: 0,
      isSubmitted: false,
    });
  },
});

export const updateReport = mutation({
  args: {
    reportId: v.id("dailyReports"),
    departureTime: v.optional(v.string()),
    returnTime: v.optional(v.string()),
    totalDistance: v.optional(v.number()),
    totalWorkingHours: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("normal"),
      v.literal("trouble"),
      v.literal("accident"),
      v.literal("delay"),
      v.literal("maintenance")
    )),
    specialNotes: v.optional(v.string()),
    isSubmitted: v.optional(v.boolean()),
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

    const { reportId, ...updateData } = args;
    await ctx.db.patch(reportId, updateData);
  },
});

export const getReportStats = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
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

    const reports = await ctx.db.query("dailyReports").collect();
    
    // 日付範囲フィルター
    const filteredReports = reports.filter((report) => {
      if (args.dateFrom && report.date < args.dateFrom) return false;
      if (args.dateTo && report.date > args.dateTo) return false;
      return true;
    });

    const totalReports = filteredReports.length;
    const submittedReports = filteredReports.filter(r => r.isSubmitted).length;
    const troubleReports = filteredReports.filter(r => r.status !== "normal").length;

    const statusCounts = filteredReports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReports,
      submittedReports,
      unsubmittedReports: totalReports - submittedReports,
      troubleReports,
      statusCounts,
    };
  },
});
