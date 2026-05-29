import { useState } from "react";
import { X, CornerDownLeft, PackageX, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { returnToMS, returnToVendor } from "../../services/laptopService";
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

export default function ReturnModal({ laptop, type, onClose }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    returnDate: today(),
    comments: "",
  });

  const set = (field) => (e) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.value,
    }));

  const isMS = type === "ms";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.returnDate) {
      toast.error("Return date is required.");
      return;
    }

    setShowConfirm(true);
  };

  const processReturn = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      if (isMS) {
        await returnToMS(laptop, form, user.email);
        toast.success("Laptop returned to Manage Service");
      } else {
        await returnToVendor(laptop, form, user.email);
        toast.success("Laptop returned to Vendor");
      }

      onClose(true);
    } catch (err) {
      toast.error(err.message || "Failed to process return.");
    } finally {
      setLoading(false);
    }
  };

  const Icon = isMS ? CornerDownLeft : PackageX;

  const title = isMS
    ? "Return to Manage Service"
    : "Return to Vendor";

  const submitLabel = isMS
    ? "Return to MS"
    : "Return to Vendor";

  const Label = ({ children, required }) => (
    <label
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "block",
        marginBottom: 5,
      }}
    >
      {children}
      {required && (
        <span style={{ color: "#ef4444", marginLeft: 2 }}>
          *
        </span>
      )}
    </label>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(17,24,39,0.45)",
        backdropFilter: "blur(5px)",
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
          maxWidth: 500,
          background: "#ffffff",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 25px 70px rgba(0,0,0,0.18)",
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
                width: 42,
                height: 42,
                borderRadius: 10,
                background: isMS ? "#ede9fe" : "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                size={20}
                style={{
                  color: isMS ? "#6d28d9" : "#dc2626",
                }}
              />
            </div>

            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  margin: 0,
                }}
              >
                {title}
              </h2>

              <p
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 3,
                }}
              >
                Process laptop return request
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280",
              transition: "0.2s",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "22px 24px" }}>
            {/* Laptop Info */}
            <div
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 22,
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
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <PackageX size={18} color="#6b7280" />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {laptop.model}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#9ca3af",
                      marginTop: 3,
                      fontFamily: "monospace",
                    }}
                  >
                    S/N: {laptop.serialNo}
                  </div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <Label required>Return Date</Label>

                <input
                  className="form-input"
                  type="date"
                  value={form.returnDate}
                  onChange={set("returnDate")}
                  required
                  onFocus={focusField}
                  onBlur={blurField}
                />
              </div>

              <div>
                <Label>Comments</Label>

                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder={
                    isMS
                      ? "Enter return reason"
                      : "Enter vendor return notes"
                  }
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
              padding: "16px 24px",
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
              className={`btn ${
                isMS ? "btn-primary" : "btn-danger"
              }`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {submitLabel}
            </button>
          </div>
        </form>
      </div>

      {showConfirm && (
        <ConfirmModal
          title={
            isMS
              ? "Confirm Return to MS"
              : "Confirm Return to Vendor"
          }
          message={`Are you sure you want to return "${laptop.model}" (S/N: ${laptop.serialNo}) to ${
            isMS ? "Manage Service" : "the Vendor"
          }?`}
          onConfirm={processReturn}
          onCancel={() => setShowConfirm(false)}
          confirmText={`Yes, ${submitLabel}`}
          confirmStyle={isMS ? "primary" : "danger"}
        />
      )}
    </div>
  );
}