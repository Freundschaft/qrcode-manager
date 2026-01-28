"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState, useTransition } from "react";
import QRCode from "qrcode";

type QRCodeRecord = {
  id: string;
  name: string;
  code: string;
  targetUrl: string;
  friendlySlug: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { visits: number };
};

type QRCodeForm = {
  name: string;
  targetUrl: string;
  friendlySlug: string;
  code: string;
};

const emptyForm: QRCodeForm = {
  name: "",
  targetUrl: "",
  friendlySlug: "",
  code: ""
};

export default function AdminClient({ initialData }: { initialData: QRCodeRecord[] }) {
  const [items, setItems] = useState<QRCodeRecord[]>(initialData);
  const [form, setForm] = useState<QRCodeForm>(emptyForm);
  const [isPending, startTransition] = useTransition();
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [activeQr, setActiveQr] = useState<{ src: string; name: string } | null>(null);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((item) => item.isActive).length;
    const visits = items.reduce((sum, item) => sum + item._count.visits, 0);
    return { total, active, visits };
  }, [items]);

  const handleCreate = () => {
    startTransition(async () => {
      const response = await fetch("/api/qrcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          targetUrl: form.targetUrl,
          friendlySlug: form.friendlySlug || null,
          code: form.code || null
        })
      });

      if (!response.ok) {
        return;
      }

      const created = (await response.json()) as QRCodeRecord;
      setItems((prev) => [created, ...prev]);
      setForm(emptyForm);
    });
  };

  const handleUpdate = (id: string, updates: Partial<QRCodeRecord>) => {
    startTransition(async () => {
      const response = await fetch(`/api/qrcodes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        return;
      }

      const updated = (await response.json()) as QRCodeRecord;
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const response = await fetch(`/api/qrcodes/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    });
  };

  return (
    <main>
      <div className="page">
        {activeQr ? (
          <div className="qr-modal" role="dialog" aria-modal="true">
            <button className="qr-modal-backdrop" onClick={() => setActiveQr(null)} aria-label="Close" />
            <div className="qr-modal-card">
              <h2>{activeQr.name}</h2>
              <img src={activeQr.src} alt={`QR code for ${activeQr.name}`} />
              <button className="button secondary" onClick={() => setActiveQr(null)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
        <section className="masthead">
          <div className="masthead-top">
            <div>
              <h1>QR Code Manager</h1>
              <p>Manage links, track visits, and deploy new QR routes in seconds.</p>
            </div>
            <button className="button secondary" onClick={() => signOut({ callbackUrl: "/" })}>
              Log out
            </button>
          </div>
          <div className="stats">
            <div className="stat">
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat">
              <span>Active</span>
              <strong>{stats.active}</strong>
            </div>
            <div className="stat">
              <span>Visits</span>
              <strong>{stats.visits}</strong>
            </div>
          </div>
        </section>

        <section className="card section">
          <div className="section-title">
            <h2>Create new QR code</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <input
              className="input"
              placeholder="Target URL"
              value={form.targetUrl}
              onChange={(event) => setForm({ ...form, targetUrl: event.target.value })}
            />
            <input
              className="input"
              placeholder="Friendly slug (optional)"
              value={form.friendlySlug}
              onChange={(event) => setForm({ ...form, friendlySlug: event.target.value })}
            />
            <input
              className="input"
              placeholder="Custom code (optional)"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
          </div>
          <div>
            <button className="button" onClick={handleCreate} disabled={isPending}>
              {isPending ? "Saving..." : "Create"}
            </button>
          </div>
        </section>

        <section className="card section" style={{ overflowX: "auto" }}>
          <div className="section-title">
            <h2>Manage existing</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Target URL</th>
                <th>Friendly URL</th>
                <th>QR</th>
                <th>Code</th>
                <th>Visits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7}>No QR codes yet.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <QRCodeRow
                    key={item.id}
                    item={item}
                    baseUrl={baseUrl}
                    onOpenQr={(src, name) => setActiveQr({ src, name })}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

function QRCodeRow({
  item,
  baseUrl,
  onOpenQr,
  onUpdate,
  onDelete
}: {
  item: QRCodeRecord;
  baseUrl: string;
  onOpenQr: (src: string, name: string) => void;
  onUpdate: (id: string, updates: Partial<QRCodeRecord>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [targetUrl, setTargetUrl] = useState(item.targetUrl);
  const [friendlySlug, setFriendlySlug] = useState(item.friendlySlug ?? "");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const publicLink = item.friendlySlug ? `/r/${item.friendlySlug}` : `/q/${item.code}`;
  const fullLink = baseUrl ? `${baseUrl}${publicLink}` : publicLink;

  const copyTextFallback = (value: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };

  const copyLink = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fullLink);
      return;
    }
    copyTextFallback(fullLink);
  };

  const ensureQr = async () => {
    if (qrDataUrl) return qrDataUrl;
    const dataUrl = await QRCode.toDataURL(fullLink, { width: 240, margin: 1 });
    setQrDataUrl(dataUrl);
    return dataUrl;
  };

  const dataUrlToBlob = async (dataUrl: string) => {
    const response = await fetch(dataUrl);
    return response.blob();
  };

  const copyQr = async () => {
    setQrBusy(true);
    try {
      const dataUrl = await ensureQr();
      const clipboard = navigator.clipboard as Clipboard | undefined;
      if (clipboard?.write) {
        const blob = await dataUrlToBlob(dataUrl);
        const item = new ClipboardItem({ [blob.type]: blob });
        await clipboard.write([item]);
        return;
      }
      if (clipboard?.writeText) {
        await clipboard.writeText(dataUrl);
        return;
      }
      copyTextFallback(dataUrl);
    } finally {
      setQrBusy(false);
    }
  };

  const downloadQr = async (format: "png" | "jpg" | "svg") => {
    let href = "";
    let extension = format;

    if (format === "png") {
      href = await ensureQr();
    }

    if (format === "jpg") {
      const dataUrl = await ensureQr();
      const image = new Image();
      image.src = dataUrl;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        href = canvas.toDataURL("image/jpeg", 0.92);
      }
    }

    if (format === "svg") {
      const svg = await QRCode.toString(fullLink, { type: "svg", margin: 1 });
      const blob = new Blob([svg], { type: "image/svg+xml" });
      href = URL.createObjectURL(blob);
    }

    const link = document.createElement("a");
    link.href = href;
    link.download = `${item.code}.${extension}`;
    link.click();

    if (format === "svg") {
      URL.revokeObjectURL(href);
    }
  };

  const save = () => {
    onUpdate(item.id, {
      name,
      targetUrl,
      friendlySlug
    });
    setEditing(false);
  };

  useEffect(() => {
    void ensureQr();
  }, [fullLink]);

  return (
    <tr>
      <td data-label="Status">
        <span className={`status-chip ${item.isActive ? "on" : "off"}`}>
          {item.isActive ? "Active" : "Paused"}
        </span>
      </td>
      <td data-label="Name">
        {editing ? (
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
        ) : (
          <strong>{item.name}</strong>
        )}
      </td>
      <td data-label="Target URL">
        {editing ? (
          <input
            className="input"
            value={targetUrl}
            onChange={(event) => setTargetUrl(event.target.value)}
          />
        ) : (
          <span>{item.targetUrl}</span>
        )}
      </td>
      <td data-label="Friendly URL">
        {editing ? (
          <input
            className="input"
            value={friendlySlug}
            onChange={(event) => setFriendlySlug(event.target.value)}
            placeholder="optional"
          />
        ) : (
          <div className="link-stack">
            <button className="link-copy" onClick={copyLink} aria-label="Copy link">
              <span className="link-copy-text">{fullLink}</span>
              <span className="link-copy-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect
                    x="9"
                    y="9"
                    width="10"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <rect
                    x="5"
                    y="5"
                    width="10"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
            </button>
          </div>
        )}
      </td>
      <td data-label="QR">
        {editing ? (
          "—"
        ) : (
          <div className="link-stack">
            {qrDataUrl ? (
              <button className="qr-preview-button" onClick={() => onOpenQr(qrDataUrl, item.name)}>
                <img src={qrDataUrl} alt={`QR code for ${item.name}`} className="qr-preview" />
              </button>
            ) : (
              <div className="qr-preview" />
            )}
            <div className="actions">
              <button className="icon-button" onClick={copyQr} disabled={qrBusy} aria-label="Copy QR">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect
                    x="9"
                    y="9"
                    width="10"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <rect
                    x="5"
                    y="5"
                    width="10"
                    height="10"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
              <button
                className="icon-button"
                onClick={() => setShowDownloadMenu((prev) => !prev)}
                aria-label="Download QR"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 4v10m0 0 3-3m-3 3-3-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 18h16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {showDownloadMenu ? (
                <div className="download-menu">
                  <button onClick={() => downloadQr("png")}>PNG</button>
                  <button onClick={() => downloadQr("jpg")}>JPG</button>
                  <button onClick={() => downloadQr("svg")}>SVG</button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </td>
      <td data-label="Code">{item.code}</td>
      <td data-label="Visits">{item._count.visits}</td>
      <td data-label="Actions" className="actions">
        {editing ? (
          <>
            <button className="button" onClick={save}>
              Save
            </button>
            <button className="button secondary" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="icon-button"
              onClick={() => onUpdate(item.id, { isActive: !item.isActive })}
              aria-label={item.isActive ? "Deactivate" : "Activate"}
              title={item.isActive ? "Deactivate" : "Activate"}
            >
              {item.isActive ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M3 3l18 18M2 12s4-6 10-6c2.1 0 4 .6 5.6 1.5M22 12s-4 6-10 6c-2.1 0-4-.6-5.6-1.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <button className="icon-button" onClick={() => setEditing(true)} aria-label="Edit">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 15.5V20h4.5L19 9.5l-4.5-4.5L4 15.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M14.5 5l4.5 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <Link className="button secondary" href={`/admin/track/${item.id}`}>
              Track
            </Link>
            <button className="button secondary" onClick={() => onDelete(item.id)}>
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
