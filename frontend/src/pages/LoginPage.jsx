import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/images.jpg";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      const msg =
        {
          "auth/user-not-found": "No account found with this email.",
          "auth/wrong-password": "Incorrect password.",
          "auth/invalid-email": "Invalid email address.",
          "auth/too-many-requests":
            "Too many attempts. Please try again later.",
          "auth/invalid-credential":
            "Invalid username or password.",
          "auth/account-disabled":
            "Your account has been deactivated. Contact a Super Admin.",
        }[err.code] ??
        "Login failed. Please check your credentials.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-xl overflow-hidden shadow-xl shadow-slate-200/60 border border-slate-200 min-h-[560px]">

        {/* LEFT PANEL */}
        <div className="relative hidden md:flex flex-col justify-between items-center text-center p-10 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800">

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Glow */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-sky-500/10 blur-[80px]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            <img
              src={logo}
              alt="Earrow Logo"
              className="h-10 w-auto object-contain brightness-110 contrast-125 mb-8"
            />

            <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
              Manage Service
              <br />
              <span className="text-indigo-200">
                System Portal
              </span>
            </h1>

            <p className="mt-4 text-slate-300 text-sm max-w-xs leading-relaxed">
              Securely manage company infrastructure,
              workflows, and operational services.
            </p>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-indigo-100 bg-white/5 border border-white/10 backdrop-blur-md py-2 px-4 rounded-lg">
            <ShieldAlert size={14} className="text-indigo-300" />
            <span>Developed by Earrow MS Team</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col justify-center p-8 sm:p-10 md:p-12 bg-white">

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-md px-3 py-1 text-[11px] font-semibold text-indigo-700 uppercase tracking-wide mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Admin Portal
            </div>

            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome Back
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3.5 mb-6 bg-rose-50 border border-rose-100 rounded-lg text-sm font-medium text-rose-700">
              <AlertCircle
                size={16}
                className="mt-0.5 text-rose-500"
              />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                required
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg text-sm bg-white border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={
                    showPass ? "text" : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-11 py-3 rounded-lg text-sm bg-white border border-slate-300 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none transition-all"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPass(!showPass)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-700 hover:bg-indigo-800 disabled:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow-md transition-all"
            >
              {loading ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Text */}
          <p className="text-[11px] text-slate-400 text-center mt-10 border-t border-slate-100 pt-6 leading-relaxed">
            This portal is restricted to authorized
            administrators only.
            <br />
            <span className="font-semibold text-slate-500">
              Unauthorized access is prohibited.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}