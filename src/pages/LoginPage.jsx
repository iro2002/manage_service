import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/images.jpg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      const msg = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-email": "Invalid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/account-disabled": "Your account has been deactivated. Contact a Super Admin.",
      }[err.code] ?? "Login failed. Please check your credentials.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-2xl overflow-hidden shadow-2xl shadow-slate-200 border border-slate-200/80 min-h-[580px]">

        {/* ── LEFT PANEL ─────────────────── */}
        <div className="relative hidden md:flex flex-col justify-between items-center text-center p-12 overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-700">

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Glow effects */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-sky-500/10 blur-[80px]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <img
              src={logo}
              alt="Earrow Logo"
              className="h-10 w-auto object-contain brightness-110 contrast-125 mb-8"
            />

            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Manage Service <br />
              <span className="text-indigo-200">System</span>
            </h1>

            <p className="mt-3 text-slate-300 text-sm max-w-xs leading-relaxed">
              Streamlining workflows, tracking company operations, and managing infrastructure.
            </p>
          </div>

          {/* Footer badge */}
          <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-indigo-100 bg-indigo-900/40 border border-indigo-700/40 backdrop-blur-md py-2 px-3 rounded-full shadow-sm">
            <ShieldAlert size={14} className="text-indigo-300" />
            <span>Developed by Manage Service Team (Earrow)</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────── */}
        <div className="flex flex-col justify-center p-8 sm:p-12 md:p-14 bg-white">

          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-[11px] font-bold text-indigo-700 tracking-wider uppercase mb-3.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Admin Portal
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>

            <p className="text-sm text-slate-400 mt-1">
              Sign in to manage company assets
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 mb-6 bg-rose-50 border border-rose-100 rounded-xl text-xs font-medium text-rose-700">
              <AlertCircle size={16} className="mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 outline-none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-11 py-2.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-[11px] text-slate-400 text-center mt-10 border-t border-slate-100 pt-6">
            This portal is restricted to authorized administrators only.
            <br />
            <span className="font-semibold text-slate-500">
              Unauthorized access is strictly prohibited.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}