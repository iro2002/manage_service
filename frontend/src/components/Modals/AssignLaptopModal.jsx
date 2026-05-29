import { useState } from "react";
import { X, UserCheck, Loader2, Mail, Laptop } from "lucide-react";
import toast from "react-hot-toast";
import { assignLaptop, DEPARTMENTS } from "../../services/laptopService";
import { useAuth } from "../../context/AuthContext";
import ConfirmModal from "./ConfirmModal";

const today = () => new Date().toISOString().split("T")[0];

const focusField = (e) => {
  e.target.style.borderColor = "#4f46e5";
  e.target.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)";
};

const blurField = (e) => {
  e.target.style.borderColor = "#e5e7eb";
  e.target.style.boxShadow = "none";
};

export default function AssignLaptopModal({ laptop, onClose }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    handoverDate: today(),
    department: "",
    comments: "",
    sendEmail: false,
  });

  const set = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.value,
    }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.userName.trim()) {
      toast.error("User name is required.");
      return;
    }

    if (!form.handoverDate) {
      toast.error("Handover date is required.");
      return;
    }

    setShowConfirm(true);
  };

  const processAssign = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const payload = {
        ...form,
        userEmail: form.sendEmail ? form.userEmail : "",
      };

      await assignLaptop(laptop, payload, user.email);

      if (payload.userEmail) {
        toast.success(
          `Laptop assigned and policy email sent to ${payload.userEmail}`
        );
      } else {
        toast.success(`Laptop assigned to ${form.userName}`);
      }

      onClose(true);
    } catch (err) {
      toast.error(err.message || "Failed to assign laptop.");
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children, required, hint }) => (
    <div style={{ marginBottom: 5 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {children}

        {required && (
          <span style={{ color: "#ef4444", marginLeft: 2 }}>
            *
          </span>
        )}
      </label>

      {hint && (
        <span
          style={{
            fontSize: 10,
            color: "#9ca3af",
            marginLeft: 6,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(17,24,39,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          background: "white",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#ede9fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCheck
                size={18}
                style={{ color: "#6d28d9" }}
              />
            </div>

            <div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Assign Laptop
              </h2>

              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 1,
                }}
              >
                Assign this asset to an employee
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
            }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "20px 24px" }}>
            {/* Laptop info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#f3f4f6",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Laptop size={18} color="#6b7280" />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#111827",
                  }}
                >
                  {laptop.model}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    marginTop: 2,
                    fontFamily: "monospace",
                  }}
                >
                  S/N: {laptop.serialNo}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px 16px",
              }}
            >
              {/* Full Name */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Label required>
                  Employee Full Name
                </Label>

                <input
                  className="form-input"
                  placeholder="e.g. Name"
                  value={form.userName}
                  onChange={set("userName")}
                  required
                  onFocus={focusField}
                  onBlur={blurField}
                />
              </div>

              {/* Email */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Label hint="(Recommended — usage policy will be emailed)">
                  Employee Email
                </Label>

                <div style={{ position: "relative" }}>
                  <Mail
                    size={14}
                    style={{
                      position: "absolute",
                      left: 11,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#9ca3af",
                      pointerEvents: "none",
                    }}
                  />

                  <input
                    className="form-input"
                    type="email"
                    placeholder="name@company.com"
                    value={form.userEmail}
                    onChange={set("userEmail")}
                    style={{ paddingLeft: 32 }}
                    onFocus={focusField}
                    onBlur={blurField}
                  />
                </div>

                {/* Email option */}
                <div style={{ marginTop: 10 }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.sendEmail}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sendEmail: e.target.checked,
                        }))
                      }
                    />

                    Send policy email to this user
                  </label>
                </div>

                {form.sendEmail && form.userEmail && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 8,
                      padding: "6px 10px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 6,
                      fontSize: 11,
                      color: "#15803d",
                    }}
                  >
                    <Mail size={11} />

                    <span>
                      A laptop usage policy email will be
                      sent to{" "}
                      <strong>
                        {form.userEmail}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Handover Date */}
              <div>
                <Label required>
                  Handover Date
                </Label>

                <input
                  className="form-input"
                  type="date"
                  value={form.handoverDate}
                  onChange={set("handoverDate")}
                  required
                  onFocus={focusField}
                  onBlur={blurField}
                />
              </div>

              {/* Department */}
              <div>
                <Label>Department</Label>

                <select
                  className="form-select"
                  value={form.department}
                  onChange={set("department")}
                  onFocus={focusField}
                  onBlur={blurField}
                >
                  <option value="">
                    Select Department
                  </option>

                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comments */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Label>Comments</Label>

                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Any notes about this assignment"
                  value={form.comments}
                  onChange={set("comments")}
                  style={{ resize: "vertical" }}
                  onFocus={focusField}
                  onBlur={blurField}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              padding: "14px 24px",
              borderTop: "1px solid #f3f4f6",
              background: "#fafafa",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading && (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              )}

              {form.sendEmail && form.userEmail
                ? "Assign & Send Email"
                : "Assign Laptop"}
            </button>
          </div>
        </form>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Confirm Assignment"
          message={`Are you sure you want to assign the laptop "${laptop.model}" to ${form.userName}?${
            form.sendEmail && form.userEmail
              ? ` A policy email will be sent to ${form.userEmail}.`
              : ""
          }`}
          onConfirm={processAssign}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}