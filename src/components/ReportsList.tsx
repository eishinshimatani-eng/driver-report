import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface ReportsListProps {
  onSelectReport: (reportId: string) => void;
}

export function ReportsList({ onSelectReport }: ReportsListProps) {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    driverId: "",
    vehicleId: "",
    status: "",
    keyword: "",
  });

  const userRole = useQuery(api.users.getCurrentUserRole);
  const drivers = useQuery(api.drivers.listDrivers, userRole === "admin" ? {} : "skip");
  const vehicles = useQuery(api.vehicles.listVehicles);

  const reports = useQuery(api.reports.listReports, {
    paginationOpts: { numItems: 20, cursor: null },
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    driverId: filters.driverId ? (filters.driverId as Id<"drivers">) : undefined,
    vehicleId: filters.vehicleId ? (filters.vehicleId as Id<"vehicles">) : undefined,
    status: filters.status || undefined,
    keyword: filters.keyword || undefined,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      normal: { label: "通常", className: "bg-green-100 text-green-800" },
      trouble: { label: "トラブル", className: "bg-yellow-100 text-yellow-800" },
      accident: { label: "事故", className: "bg-red-100 text-red-800" },
      delay: { label: "遅延", className: "bg-orange-100 text-orange-800" },
      maintenance: { label: "整備", className: "bg-blue-100 text-blue-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">日報一覧</h2>

        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {userRole === "admin" && drivers && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">運転手</label>
              <select
                value={filters.driverId}
                onChange={(e) => setFilters(prev => ({ ...prev, driverId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全て</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {vehicles && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">車両</label>
              <select
                value={filters.vehicleId}
                onChange={(e) => setFilters(prev => ({ ...prev, vehicleId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全て</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.plateNumber} ({vehicle.model})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全て</option>
              <option value="normal">通常</option>
              <option value="trouble">トラブル</option>
              <option value="accident">事故</option>
              <option value="delay">遅延</option>
              <option value="maintenance">整備</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">キーワード</label>
            <input
              type="text"
              placeholder="運転手名、車両、特記事項など"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* クイックフィルター */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setFilters(prev => ({ ...prev, dateFrom: today, dateTo: today }));
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
          >
            今日
          </button>
          <button
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split('T')[0];
              setFilters(prev => ({ ...prev, dateFrom: yesterdayStr, dateTo: yesterdayStr }));
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
          >
            昨日
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - today.getDay());
              setFilters(prev => ({
                ...prev,
                dateFrom: weekStart.toISOString().split('T')[0],
                dateTo: today.toISOString().split('T')[0]
              }));
            }}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200"
          >
            今週
          </button>
          <button
            onClick={() => setFilters({
              dateFrom: "",
              dateTo: "",
              driverId: "",
              vehicleId: "",
              status: "",
              keyword: "",
            })}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
          >
            クリア
          </button>
        </div>
      </div>

      {/* 日報リスト */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {reports === undefined ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reports.page.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">日報が見つかりません</h3>
            <p className="text-gray-600">検索条件を変更してお試しください</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日付
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    運転手
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    車両
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    稼働時間
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    承認
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.page.filter(Boolean).map((report) => {
                  if (!report) return null;
                  return (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(report.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.driver?.name || "不明"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.vehicle?.plateNumber || "不明"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.totalWorkingHours ? `${report.totalWorkingHours}時間` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.isApproved
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {report.isApproved ? "承認済み" : "未承認"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => onSelectReport(report._id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
