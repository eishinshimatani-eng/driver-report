import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

export function AdminPanel() {
  const stats = useQuery(api.reports.getReportStats, {});
  const drivers = useQuery(api.drivers.listDrivers);
  const vehicles = useQuery(api.vehicles.listVehicles);
  const users = useQuery(api.users.listUsers);

  const createVehicle = useMutation(api.vehicles.createVehicle);
  const updateVehicle = useMutation(api.vehicles.updateVehicle);
  const deleteVehicle = useMutation(api.vehicles.deleteVehicle);

  const createDriver = useMutation(api.drivers.createDriver);
  const updateDriver = useMutation(api.drivers.updateDriver);
  const deleteDriver = useMutation(api.drivers.deleteDriver);

  const updateUserRole = useMutation(api.users.updateUserRole);

  // State
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "drivers" | "vehicles">("dashboard");
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  // Alert Dialog State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
  }>({
    title: "",
    description: "",
    actionLabel: "",
    onAction: () => { },
  });

  const showAlert = (title: string, description: string, actionLabel: string, onAction: () => void) => {
    setAlertConfig({ title, description, actionLabel, onAction });
    setAlertOpen(true);
  };

  // Forms State
  const [vehicleForm, setVehicleForm] = useState({ plateNumber: "", model: "", capacity: "" });
  const [driverForm, setDriverForm] = useState({ name: "", licenseNumber: "", phone: "", userId: "" });

  // Vehicle Handlers
  const handleOpenVehicleModal = (vehicle?: any) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({
        plateNumber: vehicle.plateNumber,
        model: vehicle.model,
        capacity: vehicle.capacity?.toString() || "",
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({ plateNumber: "", model: "", capacity: "" });
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await updateVehicle({
          vehicleId: editingVehicle._id,
          plateNumber: vehicleForm.plateNumber,
          model: vehicleForm.model,
          capacity: vehicleForm.capacity ? Number(vehicleForm.capacity) : undefined,
        });
        toast.success("車両情報を更新しました");
      } else {
        await createVehicle({
          plateNumber: vehicleForm.plateNumber,
          model: vehicleForm.model,
          capacity: vehicleForm.capacity ? Number(vehicleForm.capacity) : undefined,
        });
        toast.success("車両を追加しました");
      }
      setIsVehicleModalOpen(false);
    } catch (error) {
      toast.error("エラーが発生しました: " + error);
    }
  };

  const handleDeleteVehicle = (vehicleId: Id<"vehicles">) => {
    showAlert(
      "車両の削除",
      "本当にこの車両を削除しますか？この操作は取り消せません。",
      "削除",
      async () => {
        await deleteVehicle({ vehicleId });
        toast.success("車両を削除しました");
      }
    );
  };

  const handleOpenDriverModal = (driver?: any) => {
    if (driver) {
      setEditingDriver(driver);
      setDriverForm({
        name: driver.name,
        licenseNumber: driver.licenseNumber,
        phone: driver.phone || "",
        userId: driver.userId,
      });
    } else {
      setEditingDriver(null);
      setDriverForm({ name: "", licenseNumber: "", phone: "", userId: "" });
    }
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDriver) {
        await updateDriver({
          driverId: editingDriver._id,
          name: driverForm.name,
          licenseNumber: driverForm.licenseNumber,
          phone: driverForm.phone,
        });
        toast.success("運転手情報を更新しました");
      } else {
        await createDriver({
          userId: driverForm.userId as Id<"users">,
          name: driverForm.name,
          licenseNumber: driverForm.licenseNumber,
          phone: driverForm.phone,
        });
        toast.success("運転手を追加しました");
      }
      setIsDriverModalOpen(false);
    } catch (error) {
      toast.error("エラーが発生しました: " + error);
    }
  };

  const handleDeleteDriver = (driverId: Id<"drivers">) => {
    showAlert(
      "運転手の削除",
      "本当にこの運転手を削除しますか？この操作は取り消せません。",
      "削除",
      async () => {
        await deleteDriver({ driverId });
        toast.success("運転手を削除しました");
      }
    );
  };

  const handleUpdateUserRole = (userId: Id<"users">, currentRole: string) => {
    const newRole = currentRole === "admin" ? "driver" : "admin";
    const roleName = newRole === "admin" ? "管理者" : "運転手";

    showAlert(
      "権限の変更",
      `${roleName}権限に変更しますか？`,
      "変更",
      async () => {
        try {
          await updateUserRole({ userId, role: newRole as "admin" | "driver" });
          toast.success("権限を更新しました");
        } catch (error) {
          toast.error("権限の更新に失敗しました: " + error);
        }
      }
    );
  };

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7) + "-01";

  const monthlyStats = useQuery(api.reports.getReportStats, {
    dateFrom: thisMonth,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">管理者パネル</h2>
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "dashboard" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-900"}`}
          >
            ダッシュボード
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "users" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-900"}`}
          >
            ユーザー管理
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "drivers" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-900"}`}
          >
            運転手管理
          </button>
          <button
            onClick={() => setActiveTab("vehicles")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "vehicles" ? "border-b-2 border-primary text-primary" : "text-gray-500 hover:text-gray-900"}`}
          >
            車両管理
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-xl font-bold text-foreground mb-6">全体の状況</h3>

          {/* 全体統計 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">総日報数</h3>
                <p className="text-2xl font-bold text-blue-700">{stats.totalReports}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900">承認済み</h3>
                <p className="text-2xl font-bold text-green-700">{stats.approvedReports}</p>
                <p className="text-sm text-green-600">
                  {stats.totalReports > 0
                    ? `${Math.round((stats.approvedReports / stats.totalReports) * 100)}%`
                    : "0%"
                  }
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900">未承認</h3>
                <p className="text-2xl font-bold text-yellow-700">{stats.unapprovedReports}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-900">トラブル報告</h3>
                <p className="text-2xl font-bold text-red-700">{stats.troubleReports}</p>
              </div>
            </div>
          )}

          {/* 今月の統計 */}
          {monthlyStats && (
            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">今月の状況</h3>
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
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
            <p className="text-yellow-700">
              未提出の日報や空欄の項目がある場合は、日報一覧から該当の日報を確認してください。
              運転手に提出を促すか、必要に応じて管理者が代理で入力を行ってください。
            </p>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">ユーザー一覧</h3>
          </div>
          {users === undefined ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">ユーザーがいません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メールアドレス/名前</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">現在の権限</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">関連付けられた運転手</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user: any) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name || "（未設定）"}</div>
                        <div className="text-sm text-gray-500">{user.email || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}>
                          {user.role === "admin" ? "管理者" : "運転手"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.driverName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary space-x-2">
                        <button
                          onClick={() => handleUpdateUserRole(user._id, user.role)}
                          className="hover:underline text-primary"
                        >
                          権限変更
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === "drivers" && (
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-foreground">運転手一覧</h3>
            <button
              onClick={() => handleOpenDriverModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              新規登録
            </button>
          </div>
          {drivers === undefined ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : drivers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">運転手が登録されていません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">氏名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">免許番号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">電話番号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">状態</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {drivers.map((driver) => (
                    <tr key={driver._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{driver.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{driver.licenseNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{driver.phone || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${driver.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                          {driver.isActive ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 space-x-2">
                        <button onClick={() => handleOpenDriverModal(driver)} className="hover:underline">編集</button>
                        <button onClick={() => handleDeleteDriver(driver._id)} className="text-red-600 hover:underline">削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vehicles Tab */}
      {activeTab === "vehicles" && (
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-foreground">車両一覧</h3>
            <button
              onClick={() => handleOpenVehicleModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              新規登録
            </button>
          </div>
          {vehicles === undefined ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <p className="text-gray-500 text-center py-4">車両が登録されていません</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">ナンバープレート</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">車種</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">積載量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">状態</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{vehicle.plateNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{vehicle.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{vehicle.capacity ? `${vehicle.capacity}t` : "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                          {vehicle.isActive ? "有効" : "無効"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary space-x-2">
                        <button onClick={() => handleOpenVehicleModal(vehicle)} className="hover:underline">編集</button>
                        <button onClick={() => handleDeleteVehicle(vehicle._id)} className="text-destructive hover:underline">削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* モーダル */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
            <h3 className="text-lg font-bold mb-4">{editingVehicle ? "車両編集" : "車両追加"}</h3>
            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ナンバープレート</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2 bg-background text-foreground"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">車種</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2 bg-background text-foreground"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">積載量 (t)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded p-2 bg-background text-foreground"
                  value={vehicleForm.capacity}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsVehicleModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">キャンセル</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingVehicle ? "更新" : "追加"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDriverModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md border border-border">
            <h3 className="text-lg font-bold mb-4">{editingDriver ? "運転手編集" : "運転手追加"}</h3>
            <form onSubmit={handleSaveDriver} className="space-y-4">
              {!editingDriver && (
                <div>
                  <label className="block text-sm font-medium mb-1">紐付けるユーザー</label>
                  <select
                    required
                    className="w-full border rounded p-2 bg-background text-foreground"
                    value={driverForm.userId}
                    onChange={(e) => setDriverForm({ ...driverForm, userId: e.target.value })}
                  >
                    <option value="">ユーザーを選択してください</option>
                    {users?.filter((u: any) => !u.driverId).map((u: any) => (
                      <option key={u._id} value={u._id}>
                        {u.name || u.email || "No Name"} ({u.email?.substring(0, 15)}...)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">※ すでに運転手として登録されているユーザーは表示されません</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">氏名</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2 bg-background text-foreground"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">免許番号</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2 bg-background text-foreground"
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">電話番号</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 bg-background text-foreground"
                  value={driverForm.phone}
                  onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsDriverModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">キャンセル</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">{editingDriver ? "更新" : "追加"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={alertConfig.onAction}>
              {alertConfig.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
