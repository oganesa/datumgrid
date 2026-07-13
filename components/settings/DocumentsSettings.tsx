"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ConnectionStatus =
  | { connected: false; configured: boolean }
  | { connected: true; userEmail: string };

function GoogleDriveIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
      <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.1 9.1 0 000 53h27.5z" fill="#00ac47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#ea4335" />
      <path d="M43.65 25L57.4 0H29.9z" fill="#00832d" />
      <path d="M59.8 53H87.3L59.8 5.8c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25z" fill="#2684fc" />
      <path d="M13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L59.8 53H27.5z" fill="#ffba00" />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_client_id: "Google Drive is not configured on this server yet. Please contact your administrator.",
  missing_credentials: "Google Drive credentials are missing on the server. Please contact your administrator.",
  token_exchange_failed: "Authorization failed. Please try connecting again.",
  invalid_state: "Security check failed. Please try again.",
  no_code: "No response from Google. Please try again.",
  access_denied: "Access was denied. Please try again and accept the permissions.",
};

export default function DocumentsSettings() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void fetchStatus();
    const connected = searchParams.get("gdrive_connected");
    const err = searchParams.get("gdrive_error");
    if (connected === "1") {
      setFlash({ type: "success", text: "Google Drive connected successfully." });
    } else if (err) {
      setFlash({ type: "error", text: ERROR_MESSAGES[err] ?? `Connection failed: ${err}` });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/google-drive/status");
      const data = await res.json() as ConnectionStatus;
      setStatus(data);
    } catch {
      setStatus({ connected: false, configured: false });
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/google-drive/status", { method: "DELETE" });
      setStatus({ connected: false, configured: true });
      setFlash({ type: "success", text: "Google Drive disconnected." });
    } catch {
      setFlash({ type: "error", text: "Failed to disconnect. Please try again." });
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = status?.connected === true;
  const isConfigured = isConnected || (status as { connected: false; configured?: boolean } | null)?.configured !== false;
  const email = isConnected ? (status as { connected: true; userEmail: string }).userEmail : "";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[#1C2E4A]">Documents</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Connect your cloud storage to access and manage project documents directly in DatumGrid.
        </p>
      </div>

      {/* Flash */}
      {flash && (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ${
          flash.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {flash.type === "success"
            ? <svg width="16" height="16" className="shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            : <svg width="16" height="16" className="shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          }
          {flash.text}
        </div>
      )}

      {/* Google Drive card */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
          Connected storage
        </h2>

        <div className="rounded-2xl border border-[#E5EAF2] bg-white overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5EAF2] bg-[#F7F9FC]">
                <GoogleDriveIcon size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1C2E4A]">Google Drive</p>
                <p className="text-xs text-[#6B7280]">
                  {status === null
                    ? "Checking connection…"
                    : isConnected
                      ? `Connected as ${email}`
                      : "Not connected"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isConnected && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              )}

              {status !== null && isConnected && (
                <button
                  type="button"
                  onClick={() => void disconnect()}
                  disabled={disconnecting}
                  className="rounded-lg border border-[#E5EAF2] px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-red-200 hover:text-red-500 disabled:opacity-40 transition-colors"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              )}

              {status !== null && !isConnected && isConfigured && (
                <a
                  href="/api/google-drive/auth"
                  className="flex items-center gap-2 rounded-lg bg-white border border-[#E5EAF2] px-4 py-2 text-sm font-medium text-[#374151] hover:border-[#4A90E2] hover:shadow-sm transition-all"
                >
                  <GoogleDriveIcon size={16} />
                  Sign in with Google
                </a>
              )}
            </div>
          </div>

          {/* Not configured notice (admin-only concern) */}
          {status !== null && !isConnected && !isConfigured && (
            <div className="border-t border-[#E5EAF2] bg-amber-50 px-5 py-3">
              <p className="text-xs text-amber-700">
                Google Drive integration is not yet configured on this server. Contact your administrator.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Coming soon */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] mb-3">
          Coming soon
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {["Microsoft OneDrive", "Dropbox", "SharePoint", "Box"].map((name) => (
            <div key={name} className="flex items-center gap-3 rounded-xl border border-dashed border-[#E5EAF2] bg-white px-4 py-3 opacity-40">
              <div className="h-7 w-7 rounded-lg bg-[#F7F9FC] border border-[#E5EAF2] shrink-0" />
              <span className="text-sm text-[#6B7280]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
