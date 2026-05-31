import { useState, useEffect } from "react";
import {
  fetchServers,
  createServer,
  updateServer,
  deleteServer,
  fetchServerUpdates,
  logServerUpdate,
  fetchAdminUsers,
} from "../services/serverService";
import {
  Server, Search, Plus, Loader2, Edit, Trash2, ShieldAlert,
  Clock, CheckCircle2, History, ArrowRight, X, Download, FileText,
  HardDrive, Wrench, ShieldCheck, ArrowUpCircle, Info, Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/Modals/ConfirmModal";
import ServerHistoryPanel from "../components/ServerHistoryPanel";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("");
  const [filterUpdateStatus, setFilterUpdateStatus] = useState(""); // all, updated, pending, overdue

  // Modals state
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [showLogUpdate, setShowLogUpdate] = useState(false);
  const [updatingServer, setUpdatingServer] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyServer, setHistoryServer] = useState(null);
  const [serverToDelete, setServerToDelete] = useState(null);

  // Form states
  const [serverForm, setServerForm] = useState({
    name: "", server_type: "internal", 
    cpu_cores: "", ram: "", root_disk: "",
    ip_address: "", os: "", current_version: "", 
    php_version: "", mariadb_version: "", apache_version: "",
    status: "active",
    disks: []
  });
  
  const [updateForm, setUpdateForm] = useState({
    update_date: new Date().toISOString().split("T")[0],
    next_update_date: "",
    update_types: [],
    current_version: "",
    updated_by: "",
    notes: ""
  });
  const [adminUsers, setAdminUsers] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    try {
      const data = await fetchServers();
      setServers(data || []);
    } catch (err) {
      toast.error(err.message || "Failed to load servers");
    } finally {
      setLoading(false);
    }
  };

  // ─── STATUS CALCULATION ───────────────────────────────────────────────────
  const getUpdateStatus = (nextUpdateDate) => {
    if (!nextUpdateDate) return { label: "No Data", color: "gray", icon: Clock };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextUpdateDate);
    
    if (nextDate < today) {
      return { label: "Overdue", color: "red", icon: ShieldAlert, bg: "bg-red-100", text: "text-red-700" };
    }
    
    const diffTime = Math.abs(nextDate - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays <= 7) {
      return { label: "Due Soon", color: "yellow", icon: Clock, bg: "bg-yellow-100", text: "text-yellow-700" };
    }
    
    return { label: "Updated", color: "green", icon: CheckCircle2, bg: "bg-green-100", text: "text-green-700" };
  };

  // ─── METRICS ──────────────────────────────────────────────────────────────
  const metrics = servers.reduce((acc, s) => {
    acc.total++;
    const status = getUpdateStatus(s.next_update_date);
    if (status.label === "Updated") acc.updated++;
    else if (status.label === "Due Soon") acc.pending++;
    else if (status.label === "Overdue") acc.overdue++;
    return acc;
  }, { total: 0, updated: 0, pending: 0, overdue: 0 });

  // ─── FILTERS ──────────────────────────────────────────────────────────────
  const filteredServers = servers.filter(s => {
    if (filterName && !s.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterUpdateStatus) {
      const status = getUpdateStatus(s.next_update_date);
      if (filterUpdateStatus === "updated" && status.label !== "Updated") return false;
      if (filterUpdateStatus === "pending" && status.label !== "Due Soon") return false;
      if (filterUpdateStatus === "overdue" && status.label !== "Overdue") return false;
    }
    return true;
  });

  // ─── ACTIONS ──────────────────────────────────────────────────────────────
  const handleSaveServer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingServer) {
        await updateServer(editingServer.id, serverForm);
        toast.success("Server updated");
      } else {
        await createServer(serverForm);
        toast.success("Server created");
      }
      setShowAddEdit(false);
      loadServers();
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogUpdate = async (e) => {
    e.preventDefault();
    
    if (updateForm.update_types.length === 0) {
      toast.error("Please select at least one update type.");
      return;
    }

    const uDate = new Date(updateForm.update_date);
    const day = uDate.getDate();
    if (day < 10 || day > 20) {
      toast.error("Updates can only be logged between the 10th and 20th of the month.");
      return;
    }

    setSubmitting(true);
    try {
      await logServerUpdate(updatingServer.id, updateForm);
      toast.success("Update logged successfully");
      setShowLogUpdate(false);
      loadServers();
    } catch (err) {
      toast.error(err.message || "Failed to log update");
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async () => {
    if (!serverToDelete) return;
    try {
      await deleteServer(serverToDelete.id);
      toast.success("Server deleted");
      loadServers();
    } catch (err) {
      toast.error(err.message || "Failed to delete server");
    } finally {
      setServerToDelete(null);
    }
  };

  const openHistory = async (server) => {
    setHistoryServer(server);
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const data = await fetchServerUpdates(server.id);
      setHistoryData(data || []);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const openAddEdit = (server = null) => {
    if (server) {
      setEditingServer(server);
      setServerForm({
        name: server.name, server_type: server.server_type,
        cpu_cores: server.cpu_cores || "", ram: server.ram || "", root_disk: server.root_disk || "",
        ip_address: server.ip_address, os: server.os, current_version: server.current_version,
        php_version: server.php_version || "", mariadb_version: server.mariadb_version || "", apache_version: server.apache_version || "",
        status: server.status,
        disks: server.disks ? [...server.disks] : []
      });
    } else {
      setEditingServer(null);
      setServerForm({ 
        name: "", server_type: "internal", 
        cpu_cores: "", ram: "", root_disk: "",
        ip_address: "", os: "", current_version: "", 
        php_version: "", mariadb_version: "", apache_version: "",
        status: "active",
        disks: []
      });
    }
    setShowAddEdit(true);
  };

  const openLogUpdate = async (server) => {
    setUpdatingServer(server);
    
    let today = new Date();
    let day = today.getDate();
    if (day < 10) today.setDate(10);
    else if (day > 20) today.setDate(20);

    setUpdateForm({
      update_date: today.toISOString().split("T")[0],
      next_update_date: "",
      update_types: [],
      current_version: server.current_version || "",
      updated_by: "",
      notes: ""
    });
    setShowLogUpdate(true);

    // Fetch admin users for the dropdown
    try {
      const users = await fetchAdminUsers();
      setAdminUsers(users || []);
    } catch (err) {
      // Non-critical, continue
    }
  };

  const addDisk = () => {
    setServerForm({ ...serverForm, disks: [...serverForm.disks, { mount_point: "", disk_size: "" }] });
  };
  
  const removeDisk = (index) => {
    const newDisks = [...serverForm.disks];
    newDisks.splice(index, 1);
    setServerForm({ ...serverForm, disks: newDisks });
  };
  
  const updateDisk = (index, field, value) => {
    const newDisks = [...serverForm.disks];
    newDisks[index][field] = value;
    setServerForm({ ...serverForm, disks: newDisks });
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto bg-gray-50">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      

      {/* ─── METRICS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Server size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Servers</div>
            <div className="text-xl font-bold text-gray-900">{metrics.total}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Updated</div>
            <div className="text-xl font-bold text-gray-900">{metrics.updated}</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Due Soon</div>
            <div className="text-xl font-bold text-gray-900">{metrics.pending}</div>
          </div>
          {metrics.pending > 0 && <div className="absolute top-0 right-0 w-1.5 h-full bg-yellow-400" />}
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Overdue</div>
            <div className="text-xl font-bold text-gray-900">{metrics.overdue}</div>
          </div>
          {metrics.overdue > 0 && <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500" />}
        </div>
      </div>

      {/* ─── FILTERS ─────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" placeholder="Search Server Name..." 
              className="form-input text-sm pl-9 py-1.5 w-48 lg:w-64" 
              value={filterName} onChange={e => setFilterName(e.target.value)} 
            />
          </div>
          <select 
            className="form-select text-sm py-1.5 w-40" 
            value={filterUpdateStatus} onChange={e => setFilterUpdateStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="updated">Updated (Green)</option>
            <option value="pending">Due Soon (Yellow)</option>
            <option value="overdue">Overdue (Red)</option>
          </select>
        </div>
      </div>

      {/* ─── TABLE ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="py-3 px-4">Server Details</th>
                <th className="py-3 px-4">Hardware Specs</th>
                <th className="py-3 px-4">Software Config</th>
                <th className="py-3 px-4">Update Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading servers...
                  </td>
                </tr>
              ) : filteredServers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400">No servers found.</td>
                </tr>
              ) : (
                filteredServers.map(s => {
                  const status = getUpdateStatus(s.next_update_date);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      {/* Name/IP/Type */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5 mb-1">{s.ip_address || "No IP"}</div>
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${s.server_type === "internal" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                          {s.server_type}
                        </span>
                      </td>
                      
                      {/* Hardware specs */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-600 flex flex-col gap-1">
                          {s.cpu_cores && <div><span className="font-semibold text-gray-400">CPU:</span> {s.cpu_cores}</div>}
                          {s.ram && <div><span className="font-semibold text-gray-400">RAM:</span> {s.ram}</div>}
                          {s.root_disk && <div><span className="font-semibold text-gray-400">Root:</span> {s.root_disk}</div>}
                          {s.disks && s.disks.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-gray-100">
                              {s.disks.map((d, idx) => (
                                <div key={idx} className="text-indigo-600 font-mono text-[10px]"><span className="text-gray-400">{d.mount_point}:</span> {d.disk_size}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      {/* OS & Software */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-600 flex flex-col gap-1">
                          <div><span className="font-semibold text-gray-400">OS:</span> <span className="font-medium text-gray-800">{s.os || "—"}</span> v{s.current_version}</div>
                          {s.php_version && <div><span className="font-semibold text-gray-400">PHP:</span> {s.php_version}</div>}
                          {s.mariadb_version && <div><span className="font-semibold text-gray-400">MariaDB:</span> {s.mariadb_version}</div>}
                          {s.apache_version && <div><span className="font-semibold text-gray-400">Apache:</span> {s.apache_version}</div>}
                        </div>
                      </td>
                      
                      {/* Update Status */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 w-fit px-2 py-1 rounded text-xs font-semibold ${status.bg} ${status.text}`}>
                            <StatusIcon size={12} /> {status.label}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            Next: <strong className="text-gray-700">{formatDate(s.next_update_date)}</strong>
                          </span>
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-3 px-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openLogUpdate(s)} className="btn btn-secondary py-1 px-2 text-xs flex items-center gap-1 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                            <Clock size={12} /> Log Update
                          </button>
                          <button onClick={() => openHistory(s)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View History">
                            <History size={15} />
                          </button>
                          <button onClick={() => openAddEdit(s)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit Server">
                            <Edit size={15} />
                          </button>
                          <button onClick={() => setServerToDelete(s)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD / EDIT MODAL ────────────────────────────────────────────── */}
      {showAddEdit && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">{editingServer ? "Edit Server" : "Add Server"}</h3>
              <button onClick={() => setShowAddEdit(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <form id="serverForm" onSubmit={handleSaveServer} className="space-y-6">
                
                {/* Basic Details */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-1">Basic Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Server Name *</label>
                      <input required className="form-input w-full text-sm" value={serverForm.name} onChange={e => setServerForm({...serverForm, name: e.target.value})} placeholder="e.g. PROD-DB-01" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Environment Type *</label>
                      <select className="form-select w-full text-sm" value={serverForm.server_type} onChange={e => setServerForm({...serverForm, server_type: e.target.value})}>
                        <option value="internal">Internal</option>
                        <option value="external">External</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">IP Address</label>
                      <input className="form-input w-full font-mono text-sm" value={serverForm.ip_address} onChange={e => setServerForm({...serverForm, ip_address: e.target.value})} placeholder="192.168.1.x" />
                    </div>
                  </div>
                </div>

                {/* Software Configuration */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-1">Software Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Operating System</label>
                      <input className="form-input w-full text-sm" value={serverForm.os} onChange={e => setServerForm({...serverForm, os: e.target.value})} placeholder="e.g. Ubuntu 22.04" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">OS Version</label>
                      <input className="form-input w-full font-mono text-sm" value={serverForm.current_version} onChange={e => setServerForm({...serverForm, current_version: e.target.value})} placeholder="e.g. 1.0.4" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">PHP Version</label>
                      <input className="form-input w-full text-sm" value={serverForm.php_version} onChange={e => setServerForm({...serverForm, php_version: e.target.value})} placeholder="e.g. 8.1" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">MariaDB Version</label>
                      <input className="form-input w-full text-sm" value={serverForm.mariadb_version} onChange={e => setServerForm({...serverForm, mariadb_version: e.target.value})} placeholder="e.g. 10.6" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Apache Version</label>
                      <input className="form-input w-full text-sm" value={serverForm.apache_version} onChange={e => setServerForm({...serverForm, apache_version: e.target.value})} placeholder="e.g. 2.4" />
                    </div>
                  </div>
                </div>

                {/* Hardware Configuration */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-1">Hardware & Storage</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">CPU Cores</label>
                      <input className="form-input w-full text-sm" value={serverForm.cpu_cores} onChange={e => setServerForm({...serverForm, cpu_cores: e.target.value})} placeholder="e.g. 4 Cores" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">RAM</label>
                      <input className="form-input w-full text-sm" value={serverForm.ram} onChange={e => setServerForm({...serverForm, ram: e.target.value})} placeholder="e.g. 16 GB" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Root Disk Size</label>
                      <input className="form-input w-full text-sm" value={serverForm.root_disk} onChange={e => setServerForm({...serverForm, root_disk: e.target.value})} placeholder="e.g. 100 GB NVMe" />
                    </div>
                  </div>

                  {/* Additional Disks */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-gray-700 uppercase">Additional Mount Disks</span>
                      <button type="button" onClick={addDisk} className="btn btn-secondary py-1 px-2 text-xs bg-white text-indigo-600 flex items-center gap-1">
                        <Plus size={12}/> Add Disk
                      </button>
                    </div>
                    {serverForm.disks.length === 0 ? (
                      <div className="text-xs text-gray-400 italic py-2">No additional disks configured.</div>
                    ) : (
                      <div className="space-y-2">
                        {serverForm.disks.map((disk, index) => (
                          <div key={index} className="flex gap-2 items-center bg-white p-2 border border-gray-100 rounded">
                            <HardDrive size={14} className="text-gray-400 flex-shrink-0" />
                            <input 
                              placeholder="Mount Point (e.g. /data)" 
                              className="form-input text-xs flex-1 py-1"
                              value={disk.mount_point}
                              onChange={e => updateDisk(index, "mount_point", e.target.value)}
                            />
                            <input 
                              placeholder="Size (e.g. 500GB)" 
                              className="form-input text-xs w-24 py-1"
                              value={disk.disk_size}
                              onChange={e => updateDisk(index, "disk_size", e.target.value)}
                            />
                            <button type="button" onClick={() => removeDisk(index)} className="text-red-400 hover:text-red-600 p-1">
                              <X size={14}/>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button type="button" onClick={() => setShowAddEdit(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="serverForm" disabled={submitting} className="btn btn-primary bg-indigo-600 min-w-[100px] flex justify-center">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Save Server"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LOG UPDATE MODAL ────────────────────────────────────────────── */}
      {showLogUpdate && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Log Update for {updatingServer?.name}</h3>
              <button onClick={() => setShowLogUpdate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5">
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700 flex items-start gap-2">
                <Clock size={16} className="mt-0.5 flex-shrink-0" />
                <p>Updates can only be logged between the <strong>10th and 20th</strong> of any month.</p>
              </div>

              <form id="updateForm" onSubmit={handleLogUpdate} className="space-y-4">

                {/* Update Types — multi-select checkboxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 gap-2">
                    {["OS Update", "Application Update"].map(type => {
                      const checked = updateForm.update_types.includes(type);
                      return (
                        <label
                          key={type}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            checked
                              ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                              : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"
                          }`}>
                            {checked && (
                              <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2.5">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium">{type}</span>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? updateForm.update_types.filter(t => t !== type)
                                : [...updateForm.update_types, type];
                              setUpdateForm({...updateForm, update_types: next});
                            }}
                          />
                        </label>
                      );
                    })}
                  </div>
                  {updateForm.update_types.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {updateForm.update_types.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {t}
                          <button type="button" onClick={() => setUpdateForm({...updateForm, update_types: updateForm.update_types.filter(x => x !== t)})} className="ml-0.5 hover:text-indigo-900">
                            <X size={10}/>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Performed By dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Performed By <span className="text-red-500">*</span></label>
                  <select
                    required
                    className="form-select w-full"
                    value={updateForm.updated_by}
                    onChange={e => setUpdateForm({...updateForm, updated_by: e.target.value})}
                  >
                    <option value="">-- Select Admin --</option>
                    {adminUsers.map(u => (
                      <option key={u.id} value={u.email}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Applied <span className="text-red-500">*</span></label>
                    <input 
                      required type="date" 
                      className="form-input w-full" 
                      value={updateForm.update_date} 
                      onChange={e => {
                        const d = e.target.value;
                        const day = new Date(d).getDate();
                        if (day >= 10 && day <= 20) {
                          setUpdateForm({...updateForm, update_date: d});
                        } else {
                          toast.error("Please select a date between the 10th and 20th.");
                        }
                      }} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date <span className="text-red-500">*</span></label>
                    <input 
                      required type="date" 
                      className="form-input w-full" 
                      value={updateForm.next_update_date} 
                      onChange={e => setUpdateForm({...updateForm, next_update_date: e.target.value})} 
                    />
                  </div>
                </div>
                <div>
                  
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea className="form-input w-full" rows="3" value={updateForm.notes} onChange={e => setUpdateForm({...updateForm, notes: e.target.value})} placeholder="What was updated?" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button type="button" onClick={() => setShowLogUpdate(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="updateForm" disabled={submitting} className="btn btn-primary bg-indigo-600 min-w-[100px] flex justify-center">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Log Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HISTORY PANEL ───────────────────────────────────────────────── */}
      {showHistory && (
        <ServerHistoryPanel
          server={historyServer}
          historyData={historyData}
          loading={loadingHistory}
          onClose={() => setShowHistory(false)}
        />
      )}



      {/* ─── DELETE CONFIRM ──────────────────────────────────────────────── */}
      {serverToDelete && (
        <ConfirmModal
          title="Delete Server?"
          message={`Are you sure you want to delete ${serverToDelete.name}? All update history for this server will also be permanently deleted.`}
          onConfirm={executeDelete}
          onCancel={() => setServerToDelete(null)}
          confirmText="Yes, Delete"
          confirmStyle="danger"
        />
      )}
    </div>
  );
}
