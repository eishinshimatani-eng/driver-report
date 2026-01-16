import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ReportDetailProps {
  reportId: string;
  onBack: () => void;
}

export function ReportDetail({ reportId, onBack }: ReportDetailProps) {
  const report = useQuery(api.reports.getReport, { 
    reportId: reportId as Id<"dailyReports"> 
  });

  const getStatusLabel = (status: string) => {
    const statusMap = {
      normal: "通常",
      trouble: "トラブル",
      accident: "事故",
      delay: "遅延",
      maintenance: "整備",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "-";
    return timeStr;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  if (report === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">日報が見つかりません</h3>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800"
        >
          一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <span className="mr-2">←</span>
            一覧に戻る
          </button>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.isSubmitted 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"
            }`}>
              {report.isSubmitted ? "提出済み" : "未提出"}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.status === "normal" ? "bg-green-100 text-green-800" :
              report.status === "trouble" ? "bg-yellow-100 text-yellow-800" :
              report.status === "accident" ? "bg-red-100 text-red-800" :
              report.status === "delay" ? "bg-orange-100 text-orange-800" :
              "bg-blue-100 text-blue-800"
            }`}>
              {getStatusLabel(report.status)}
            </span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {formatDate(report.date)} の運行日報
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">運転手</h3>
            <p className="text-lg font-semibold text-gray-900">{report.driver?.name || "不明"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">車両</h3>
            <p className="text-lg font-semibold text-gray-900">
              {report.vehicle?.plateNumber || "不明"}
            </p>
            <p className="text-sm text-gray-600">{report.vehicle?.model}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">出庫時刻</h3>
            <p className="text-lg font-semibold text-gray-900">{formatTime(report.departureTime)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">帰庫時刻</h3>
            <p className="text-lg font-semibold text-gray-900">{formatTime(report.returnTime)}</p>
          </div>
        </div>

        {(report.totalDistance || report.totalWorkingHours) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
            {report.totalDistance && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">総走行距離</h3>
                <p className="text-lg font-semibold text-gray-900">{report.totalDistance} km</p>
              </div>
            )}
            {report.totalWorkingHours && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">総稼働時間</h3>
                <p className="text-lg font-semibold text-gray-900">{report.totalWorkingHours} 時間</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 運行明細 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">運行明細</h2>
        
        {report.tripEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            運行明細が登録されていません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    順序
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    案件/便名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    積み先
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    降ろし先
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    開始時刻
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    終了時刻
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    距離
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    待機時間
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    備考
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.tripEntries.map((entry) => (
                  <tr key={entry._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.sequence}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.orderNumber || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {entry.pickupLocation}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {entry.deliveryLocation}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(entry.startTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(entry.endTime)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.distance ? `${entry.distance} km` : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.waitingTime ? `${entry.waitingTime} 分` : "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {entry.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 特記事項 */}
      {report.specialNotes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">特記事項</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-900 whitespace-pre-wrap">{report.specialNotes}</p>
          </div>
        </div>
      )}

      {/* 添付ファイル */}
      {report.attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">添付ファイル</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.attachments.map((attachment) => (
              <div key={attachment._id} className="border rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {attachment.filename}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {attachment.fileType}
                </div>
                {attachment.description && (
                  <div className="text-sm text-gray-700">
                    {attachment.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
