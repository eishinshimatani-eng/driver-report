import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { ReportsList } from "./components/ReportsList";
import { ReportDetail } from "./components/ReportDetail";
import { AdminPanel } from "./components/AdminPanel";
import { CreateReportForm } from "./components/CreateReportForm";
import { useState } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "reports" | "admin" | "create-report">("dashboard");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const userRole = useQuery(api.users.getCurrentUserRole);

  const handleNavigateToReports = () => {
    setCurrentView("reports");
    setSelectedReportId(null);
  };

  const handleCreateReport = () => {
    setCurrentView("create-report");
    setSelectedReportId(null);
  };

  const handleCreateReportSuccess = (reportId: string) => {
    setSelectedReportId(reportId);
    setCurrentView("reports");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedReportId(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900">運行日報管理システム</h1>
            <Authenticated>
              <nav className="flex gap-4">
                <button
                  onClick={() => {
                    setCurrentView("dashboard");
                    setSelectedReportId(null);
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === "dashboard"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  ダッシュボード
                </button>
                <button
                  onClick={() => {
                    setCurrentView("reports");
                    setSelectedReportId(null);
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === "reports"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  日報一覧
                </button>
                {userRole === "admin" && (
                  <button
                    onClick={() => {
                      setCurrentView("admin");
                      setSelectedReportId(null);
                    }}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === "admin"
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    管理
                  </button>
                )}
              </nav>
            </Authenticated>
          </div>
          <SignOutButton />
        </div>
      </header>

      <main className="flex-1">
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="w-full max-w-md mx-auto p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h2>
                <p className="text-gray-600">運行日報管理システムにアクセスするにはログインが必要です</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Authenticated>
          <div className="max-w-7xl mx-auto px-4 py-6">
            {selectedReportId ? (
              <ReportDetail
                reportId={selectedReportId}
                onBack={() => setSelectedReportId(null)}
              />
            ) : currentView === "dashboard" ? (
              <Dashboard 
                onNavigateToReports={handleNavigateToReports}
                onCreateReport={handleCreateReport}
              />
            ) : currentView === "reports" ? (
              <ReportsList onSelectReport={setSelectedReportId} />
            ) : currentView === "admin" ? (
              <AdminPanel />
            ) : currentView === "create-report" ? (
              <CreateReportForm 
                onBack={handleBackToDashboard}
                onSuccess={handleCreateReportSuccess}
              />
            ) : null}
          </div>
        </Authenticated>
      </main>
      <Toaster />
    </div>
  );
}
