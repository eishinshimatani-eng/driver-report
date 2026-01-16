import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface CreateReportFormProps {
  onBack: () => void;
  onSuccess: (reportId: string) => void;
}

export function CreateReportForm({ onBack, onSuccess }: CreateReportFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicleId: "",
    departureTime: "",
    returnTime: "",
    status: "normal" as const,
    specialNotes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const vehicles = useQuery(api.vehicles.listVehicles);
  const createReport = useMutation(api.reports.createReport);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicleId) {
      toast.error("車両を選択してください");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reportId = await createReport({
        date: formData.date,
        vehicleId: formData.vehicleId as Id<"vehicles">,
        departureTime: formData.departureTime || undefined,
        returnTime: formData.returnTime || undefined,
        status: formData.status,
        specialNotes: formData.specialNotes || undefined,
      });

      toast.success("日報を作成しました");
      onSuccess(reportId);
    } catch (error) {
      console.error("日報作成エラー:", error);
      toast.error(error instanceof Error ? error.message : "日報の作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <span className="mr-2">←</span>
            戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">新しい日報を作成</h1>
          <div></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                車両 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.vehicleId}
                onChange={(e) => handleInputChange("vehicleId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">車両を選択してください</option>
                {vehicles?.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.plateNumber} - {vehicle.model}
                    {vehicle.capacity && ` (${vehicle.capacity}t)`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 時刻情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                出庫時刻
              </label>
              <input
                type="time"
                value={formData.departureTime}
                onChange={(e) => handleInputChange("departureTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                帰庫時刻
              </label>
              <input
                type="time"
                value={formData.returnTime}
                onChange={(e) => handleInputChange("returnTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ステータス */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ステータス <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="normal">通常</option>
              <option value="trouble">トラブル</option>
              <option value="accident">事故</option>
              <option value="delay">遅延</option>
              <option value="maintenance">整備</option>
            </select>
          </div>

          {/* 特記事項 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              特記事項
            </label>
            <textarea
              value={formData.specialNotes}
              onChange={(e) => handleInputChange("specialNotes", e.target.value)}
              rows={4}
              placeholder="特記事項があれば入力してください..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 注意事項 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">
              📝 作成後の編集について
            </h3>
            <p className="text-sm text-blue-700">
              日報作成後は、運行明細の追加や詳細情報の編集が可能です。
              まずは基本情報を入力して日報を作成してください。
            </p>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.vehicleId}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "作成中..." : "日報を作成"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
