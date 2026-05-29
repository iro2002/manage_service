import { useState, useEffect } from "react";
import { fetchDbUsers } from "../services/dbUsersService";
import { Loader2, Database, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const IDLE = "idle", LOADING = "loading", ERROR = "error";

export default function DbUsersPage() {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState(LOADING);
  const [errorMsg, setErrorMsg] = useState("");
  const [creds, setCreds] = useState({ host: "", port: "3306", user: "", password: "" });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (customCreds = null) => {
    setStatus(LOADING);
    try {
      const data = await fetchDbUsers(customCreds || {});
      setUsers(data);
      setStatus(IDLE);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to load database users");
      setStatus(ERROR);
      toast.error(err.message || "Failed to load database users");
    }
  };

  const PrivIcon = ({ val }) => (
    val ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-gray-300" />
  );

  const handleConnect = (e) => {
    e.preventDefault();
    if (creds.host && !creds.user) {
      toast.error("Please enter a username for the remote connection.");
      return;
    }
    loadUsers(creds.host ? creds : {});
  };

  const handleClear = () => {
    setCreds({ host: "", port: "3306", user: "", password: "" });
    loadUsers({});
  };

  const setC = (f) => (e) => setCreds(c => ({ ...c, [f]: e.target.value }));

  if (status === LOADING) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
        <p>Loading database privileges...</p>
      </div>
    );
  }

  if (status === ERROR) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600 max-w-md text-center">{errorMsg}</p>
        <button onClick={loadUsers} className="mt-6 btn btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex-1 overflow-y-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-indigo-600" />
            MySQL Server Privileges
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Viewing access levels for all databases on the connected MySQL server.
          </p>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="btn btn-secondary text-xs py-1.5">
          {showConfig ? "Hide Connection Config" : "Configure Remote Server"}
        </button>
      </div>

      {showConfig && (
        <form onSubmit={handleConnect} className="mb-6 bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
            Remote Server Configuration
          </h3>
          <p className="text-xs text-indigo-700/70 mb-4">
            Enter credentials to analyze a remote cloud database. Leave blank to query the local application database.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-indigo-800 mb-1">Host / IP</label>
              <input type="text" className="form-input text-sm" placeholder="e.g., db.example.com" value={creds.host} onChange={setC("host")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-800 mb-1">Port</label>
              <input type="text" className="form-input text-sm" placeholder="3306" value={creds.port} onChange={setC("port")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-800 mb-1">Username</label>
              <input type="text" className="form-input text-sm" placeholder="root" value={creds.user} onChange={setC("user")} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-800 mb-1">Password</label>
              <input type="password" className="form-input text-sm" placeholder="••••••••" value={creds.password} onChange={setC("password")} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleClear} className="btn btn-secondary text-sm">Reset to Local DB</button>
            <button type="submit" className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-sm">Connect & Analyze</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="py-3 px-4">MySQL User</th>
                <th className="py-3 px-4">Host</th>
                <th className="py-3 px-4">Database</th>
                <th className="py-3 px-4 text-center">Select</th>
                <th className="py-3 px-4 text-center">Insert</th>
                <th className="py-3 px-4 text-center">Update</th>
                <th className="py-3 px-4 text-center">Delete</th>
                <th className="py-3 px-4 text-center">Create</th>
                <th className="py-3 px-4 text-center">Drop</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  // Render a row for Global privileges, then rows for specific DBs
                  const rows = [];
                  
                  // Global row
                  rows.push(
                    <tr key={`${u.user}-${u.host}-global`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="py-3 px-4 font-medium text-gray-900">{u.user}</td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-xs">{u.host}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                          *.* (Global)
                        </span>
                        {u.global_privileges.super && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title="Super Admin">
                            SUPER
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center"><div className="flex justify-center"><PrivIcon val={u.global_privileges.select} /></div></td>
                      <td className="py-3 px-4 text-center"><div className="flex justify-center"><PrivIcon val={u.global_privileges.insert} /></div></td>
                      <td className="py-3 px-4 text-center"><div className="flex justify-center"><PrivIcon val={u.global_privileges.update} /></div></td>
                      <td className="py-3 px-4 text-center"><div className="flex justify-center"><PrivIcon val={u.global_privileges.delete} /></div></td>
                      <td className="py-3 px-4 text-center"><div className="flex justify-center"><PrivIcon val={u.global_privileges.create} /></div></td>
                      <td className="py-3 px-4 text-center"><div className="flex justify-center"><PrivIcon val={u.global_privileges.drop} /></div></td>
                    </tr>
                  );

                  // DB specific rows
                  u.databases.forEach(db => {
                    rows.push(
                      <tr key={`${u.user}-${u.host}-${db.db}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="py-2 px-4 border-l-2 border-transparent"></td>
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                            {db.db}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center"><div className="flex justify-center"><PrivIcon val={db.select} /></div></td>
                        <td className="py-2 px-4 text-center"><div className="flex justify-center"><PrivIcon val={db.insert} /></div></td>
                        <td className="py-2 px-4 text-center"><div className="flex justify-center"><PrivIcon val={db.update} /></div></td>
                        <td className="py-2 px-4 text-center"><div className="flex justify-center"><PrivIcon val={db.delete} /></div></td>
                        <td className="py-2 px-4 text-center"><div className="flex justify-center"><PrivIcon val={db.create} /></div></td>
                        <td className="py-2 px-4 text-center"><div className="flex justify-center"><PrivIcon val={db.drop} /></div></td>
                      </tr>
                    );
                  });

                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
