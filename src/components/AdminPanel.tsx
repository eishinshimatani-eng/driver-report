import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function AdminPanel() {
  const stats = useQuery(api.reports.getReportStats, {});
  const drivers = useQuery(api.drivers.listDrivers);
  const vehicles = useQuery(api.vehicles.listVehicles);

  const createVehicle = useMutation(api.vehicles.createVehicle);
  const updateVehicle = useMutation(api.vehicles.updateVehicle);
  const deleteVehicle = useMutation(api.vehicles.deleteVehicle);

  const createDriver = useMutation(api.drivers.createDriver);
  const updateDriver = useMutation(api.drivers.updateDriver);
  const deleteDriver = useMutation(api.drivers.deleteDriver);

  // State
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

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
      } else {
        await createVehicle({
          plateNumber: vehicleForm.plateNumber,
          model: vehicleForm.model,
          capacity: vehicleForm.capacity ? Number(vehicleForm.capacity) : undefined,
        });
      }
      setIsVehicleModalOpen(false);
    } catch (error) {
      alert("エラーが発生しました: " + error);
    }
  };

  const handleDeleteVehicle = async (vehicleId: Id<"vehicles">) => {
    if (confirm("本当にこの車両を削除しますか？")) {
      await deleteVehicle({ vehicleId });
    }
  };

  // Driver Handlers
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
      } else {
        await createDriver({
          userId: driverForm.userId as Id<"users">,
          name: driverForm.name,
          licenseNumber: driverForm.licenseNumber,
          phone: driverForm.phone,
        });
      }
      setIsDriverModalOpen(false);
    } catch (error) {
      alert("エラーが発生しました: " + error);
    }
  };

  const handleDeleteDriver = async (driverId: Id<"drivers">) => {
    if (confirm("本当にこの運転手を削除しますか？")) {
      await deleteDriver({ driverId });
    }
  };

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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">運転手一覧</h3>
          <button
            onClick={() => handleOpenDriverModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            新規登録
          </button>
        </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">免許番号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">電話番号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{driver.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.licenseNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.phone || "-"}</td>
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

      {/* 車両一覧 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">車両一覧</h3>
          <button
            onClick={() => handleOpenVehicleModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            新規登録
          </button>
        </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ナンバープレート</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">車種</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">積載量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.plateNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.capacity ? `${vehicle.capacity}t` : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                        {vehicle.isActive ? "有効" : "無効"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 space-x-2">
                      <button onClick={() => handleOpenVehicleModal(vehicle)} className="hover:underline">編集</button>
                      <button onClick={() => handleDeleteVehicle(vehicle._id)} className="text-red-600 hover:underline">削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* モーダル (簡易実装) */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingVehicle ? "車両編集" : "車両追加"}</h3>
            <form onSubmit={handleSaveVehicle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ナンバープレート</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">車種</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">積載量 (t)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded p-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingDriver ? "運転手編集" : "運転手追加"}</h3>
            <form onSubmit={handleSaveDriver} className="space-y-4">
              {!editingDriver && (
                <div>
                  <label className="block text-sm font-medium mb-1">ユーザーID (User ID)</label>
                  <input
                    type="text"
                    required
                    placeholder="Convex User ID"
                    className="w-full border rounded p-2"
                    value={driverForm.userId}
                    onChange={(e) => setDriverForm({ ...driverForm, userId: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">※ 新規登録時はシステム上のUser IDが必要です</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">氏名</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">免許番号</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded p-2"
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">電話番号</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
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

      {/* 注意事項 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 注意事項</h3>
        <p className="text-yellow-700">
          未提出の日報や空欄の項目がある場合は、日報一覧から該当の日報を確認してください。
          運転手に提出を促すか、必要に応じて管理者が代理で入力を行ってください。
        </p>
      </div>
    </div>
  );
}
