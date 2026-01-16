import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminPanel() {
  const stats = useQuery(api.reports.getReportStats, {});
  const drivers = useQuery(api.drivers.listDrivers);
  const vehicles = useQuery(api.vehicles.listVehicles);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7) + "-01";
  
  const monthlyStats = useQuery(api.reports.getReportStats, {
    dateFrom: thisMonth,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">管理者パネル</h2>

        {/* 全体統計 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">総日報数</h3>
              <p className="text-2xl font-bold text-blue-700">{stats.totalReports}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">提出済み</h3>
              <p className="text-2xl font-bold text-green-700">{stats.submittedReports}</p>
              <p className="text-sm text-green-600">
                {stats.totalReports > 0 
                  ? `${Math.round((stats.submittedReports / stats.totalReports) * 100)}%`
                  : "0%"
                }
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900">未提出</h3>
              <p className="text-2xl font-bold text-yellow-700">{stats.unsubmittedReports}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-900">トラブル報告</h3>
              <p className="text-2xl font-bold text-red-700">{stats.troubleReports}</p>
            </div>
          </div>
        )}

        {/* 今月の統計 */}
        {monthlyStats && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">今月の状況</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(monthlyStats.statusCounts).map(([status, count]) => (
                <div key={status} className="text-center">
                  <p className="text-sm text-gray-600">
                    {status === "normal" ? "通常" :
                     status === "trouble" ? "トラブル" :
                     status === "accident" ? "事故" :
                     status === "delay" ? "遅延" :
                     status === "maintenance" ? "整備" : status}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 運転手一覧 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">運転手一覧</h3>
        {drivers === undefined ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : drivers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">運転手が登録されていません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    免許番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    電話番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状態
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {driver.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.licenseNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        driver.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {driver.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 車両一覧 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">車両一覧</h3>
        {vehicles === undefined ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <p className="text-gray-500 text-center py-4">車両が登録されていません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ナンバープレート
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    車種
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    積載量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状態
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicle.plateNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.capacity ? `${vehicle.capacity}t` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vehicle.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {vehicle.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 未提出日報の検知 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          ⚠️ 注意事項
        </h3>
        <p className="text-yellow-700">
          未提出の日報や空欄の項目がある場合は、日報一覧から該当の日報を確認してください。
          運転手に提出を促すか、必要に応じて管理者が代理で入力を行ってください。
        </p>
      </div>
    </div>
  );
}
