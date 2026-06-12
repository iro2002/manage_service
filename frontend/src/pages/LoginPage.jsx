import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

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
          "auth/too-many-requests": "Too many attempts. Please try again later.",
          "auth/invalid-credential": "Invalid username or password.",
          "auth/account-disabled": "Your account has been deactivated. Contact a Super Admin.",
        }[err.code] ?? "Login failed. Please check your credentials.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 sm:p-8 font-sans antialiased text-slate-800">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[600px]">
        
        {/* LEFT PANEL - Premium Blue Branding */}
        <div className="relative hidden md:flex flex-col justify-between p-12 bg-[#0f1d4a] overflow-hidden">
          {/* Glowing ambient blue backgrounds */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -left-[10%] w-[75%] h-[75%] rounded-full bg-blue-600/20 blur-[100px]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[75%] h-[75%] rounded-full bg-indigo-500/20 blur-[100px]" />
          </div>

          {/* Top Logo */}
          <div className="relative z-10">
            <img
              src={logo}
              alt="Earrow Logo"
              className="h-9 w-auto object-contain opacity-90"
            />
          </div>

          {/* Middle Content */}
          <div className="relative z-10 max-w-sm">
            <h1 className="text-3xl lg:text-4xl font-medium text-white tracking-tight leading-tight mb-4">
              Manage Service <br />
              <span className="text-blue-300">System Portal</span>
            </h1>
            <p className="text-blue-200/80 text-base leading-relaxed">
              Securely manage company infrastructure, workflows, and operational services from one unified dashboard.
            </p>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 flex items-center gap-2.5 text-sm font-medium text-blue-300/80">
            <ShieldCheck size={18} className="text-blue-400" />
            <span>Developed by Earrow MS Team</span>
          </div>
        </div>

        {/* RIGHT PANEL - Clean Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="max-w-sm w-full mx-auto">
            
            {/* Header */}
            <div className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Welcome back
              </h2>
              <p className="text-slate-500 mt-2 text-sm">
                Please enter your details to sign in.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 mb-6 bg-red-50/50 border border-red-100 rounded-xl text-sm text-red-600">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  className="w-full px-4 py-3.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:text-blue-100 text-white font-medium text-sm rounded-xl transition-colors mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <p className="text-xs text-slate-400 text-center mt-10 leading-relaxed">
              This portal is restricted to authorized administrators. <br />
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}