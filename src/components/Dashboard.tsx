import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface DashboardProps {
  onNavigateToReports?: () => void;
  onCreateReport?: () => void;
}

export function Dashboard({ onNavigateToReports, onCreateReport }: DashboardProps) {
  const userRole = useQuery(api.users.getCurrentUserRole);
  const currentDriver = useQuery(api.users.getCurrentDriver);
  const stats = useQuery(api.reports.getReportStats, 
    userRole === "admin" ? {} : "skip"
  );

  const today = new Date().toISOString().split('T')[0];
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

  const weeklyStats = useQuery(api.reports.getReportStats,
    userRole === "admin" ? { dateFrom: thisWeekStartStr } : "skip"
  );

  const handleCreateReport = () => {
    if (onCreateReport) {
      onCreateReport();
    }
  };

  const handleSearchReports = () => {
    if (onNavigateToReports) {
      onNavigateToReports();
    }
  };

  if (userRole === undefined) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {userRole === "admin" ? "管理者ダッシュボード" : "運転手ダッシュボード"}
        </h2>
        
        {userRole === "driver" && currentDriver && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900">運転手情報</h3>
            <p className="text-blue-700">氏名: {currentDriver.name}</p>
            <p className="text-blue-700">免許番号: {currentDriver.licenseNumber}</p>
          </div>
        )}

        {userRole === "admin" && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">総日報数</h3>
              <p className="text-2xl font-bold text-blue-700">{stats.totalReports}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900">提出済み</h3>
              <p className="text-2xl font-bold text-green-700">{stats.submittedReports}</p>
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

        {userRole === "admin" && weeklyStats && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">今週の状況</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(weeklyStats.statusCounts).map(([status, count]) => (
                <div key={status} className="text-center">
                  <p className="text-sm text-gray-600 capitalize">
                    {status === "normal" ? "通常" :
                     status === "trouble" ? "トラブル" :
                     status === "accident" ? "事故" :
                     status === "delay" ? "遅延" :
                     status === "maintenance" ? "整備" : status}
                  </p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleCreateReport}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📝</div>
              <h4 className="font-semibold text-gray-900">新しい日報を作成</h4>
              <p className="text-sm text-gray-600">今日の運行日報を作成します</p>
            </div>
          </button>
          
          <button 
            onClick={handleSearchReports}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900">日報を検索</h4>
              <p className="text-sm text-gray-600">過去の日報を検索・閲覧します</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
