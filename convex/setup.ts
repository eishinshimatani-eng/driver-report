import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const setupSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("認証が必要です");
    }

    // 管理者権限をチェック
    const userRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (userRole?.role !== "admin") {
      // 管理者ロールが存在しない場合は作成
      await ctx.db.insert("userRoles", {
        userId,
        role: "admin",
      });
    }

    // サンプル車両を作成
    const existingVehicles = await ctx.db.query("vehicles").collect();
    if (existingVehicles.length === 0) {
      await ctx.db.insert("vehicles", {
        plateNumber: "品川 500 あ 1234",
        model: "いすゞ エルフ",
        capacity: 2,
        isActive: true,
      });

      await ctx.db.insert("vehicles", {
        plateNumber: "品川 500 あ 5678",
        model: "三菱 キャンター",
        capacity: 3,
        isActive: true,
      });

      await ctx.db.insert("vehicles", {
        plateNumber: "品川 500 あ 9012",
        model: "日野 デュトロ",
        capacity: 4,
        isActive: true,
      });
    }

    // 運転手情報を作成（現在のユーザーを運転手として登録）
    const existingDriver = await ctx.db
      .query("drivers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existingDriver) {
      await ctx.db.insert("drivers", {
        userId,
        name: "テスト運転手",
        licenseNumber: "123456789012",
        phone: "090-1234-5678",
        isActive: true,
      });
    }

    return { success: true, message: "サンプルデータを作成しました" };
  },
});
