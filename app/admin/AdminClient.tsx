"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

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
      <div className="stack">
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <h1>QR Codes</h1>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span className="badge">Total: {stats.total}</span>
            <span className="badge">Active: {stats.active}</span>
            <span className="badge">Visits: {stats.visits}</span>
          </div>
        </div>

        <div className="card" style={{ display: "grid", gap: 12 }}>
          <h2>Create new QR code</h2>
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
          <button className="button" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Saving..." : "Create"}
          </button>
        </div>

        <div className="card" style={{ overflowX: "auto" }}>
          <h2>Manage existing</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Target URL</th>
                <th>Friendly URL</th>
                <th>Code</th>
                <th>Status</th>
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
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function QRCodeRow({
  item,
  onUpdate,
  onDelete
}: {
  item: QRCodeRecord;
  onUpdate: (id: string, updates: Partial<QRCodeRecord>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [targetUrl, setTargetUrl] = useState(item.targetUrl);
  const [friendlySlug, setFriendlySlug] = useState(item.friendlySlug ?? "");

  const publicLink = item.friendlySlug ? `/r/${item.friendlySlug}` : `/q/${item.code}`;

  const save = () => {
    onUpdate(item.id, {
      name,
      targetUrl,
      friendlySlug
    });
    setEditing(false);
  };

  return (
    <tr>
      <td>
        {editing ? (
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
        ) : (
          <strong>{item.name}</strong>
        )}
      </td>
      <td>
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
      <td>
        {editing ? (
          <input
            className="input"
            value={friendlySlug}
            onChange={(event) => setFriendlySlug(event.target.value)}
            placeholder="optional"
          />
        ) : (
          <span>{publicLink}</span>
        )}
      </td>
      <td>{item.code}</td>
      <td>
        <button
          className={`button ${item.isActive ? "" : "secondary"}`}
          onClick={() => onUpdate(item.id, { isActive: !item.isActive })}
        >
          {item.isActive ? "Active" : "Paused"}
        </button>
      </td>
      <td>{item._count.visits}</td>
      <td style={{ display: "flex", gap: 8 }}>
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
            <button className="button secondary" onClick={() => setEditing(true)}>
              Edit
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
