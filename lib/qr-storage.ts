import { getStore } from "@netlify/blobs";
import { randomUUID } from "crypto";

import { generateCode, hashIp } from "./qrcode";

export type QRCodeRecord = {
  id: string;
  name: string;
  code: string;
  targetUrl: string;
  friendlySlug: string | null;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type QRCodeWithCount = QRCodeRecord & { _count: { visits: number } };

export type QRVisit = {
  id: string;
  qrCodeId: string;
  visitedAt: string;
  userAgent?: string | null;
  referrer?: string | null;
  ipHash?: string | null;
};

type QRStats = { visits: number };

const STORE_NAMES = {
  qr: "qr-codes",
  index: "qr-indexes",
  stats: "qr-stats",
  visits: "qr-visits"
};

function storeOptions(name: string) {
  const siteID = process.env.NETLIFY_SITE_ID;
  const token = process.env.NETLIFY_AUTH_TOKEN;

  if (siteID && token) {
    return { name, siteID, token, consistency: "strong" as const };
  }

  return { name, consistency: "strong" as const };
}

function qrStore() {
  return getStore(storeOptions(STORE_NAMES.qr));
}

function indexStore() {
  return getStore(storeOptions(STORE_NAMES.index));
}

function statsStore() {
  return getStore(storeOptions(STORE_NAMES.stats));
}

function visitsStore() {
  return getStore(storeOptions(STORE_NAMES.visits));
}

function buildUserKey(userId: string, id: string) {
  return `user/${userId}/${id}`;
}

function buildCodeKey(code: string) {
  return `code/${code}`;
}

function buildSlugKey(slug: string) {
  return `slug/${slug}`;
}

function buildStatsKey(id: string) {
  return `stats/${id}`;
}

function buildVisitKey(id: string, timestamp: string) {
  return `visit/${id}/${timestamp}-${randomUUID()}`;
}

async function getStatsFor(id: string) {
  const stats = (await statsStore().get(buildStatsKey(id), { type: "json" })) as QRStats | null;
  return stats ?? { visits: 0 };
}

export async function listQRCodesForUser(userId: string): Promise<QRCodeWithCount[]> {
  const { blobs } = await qrStore().list({ prefix: `user/${userId}/` });

  const records = await Promise.all(
    blobs.map(async (blob) => (await qrStore().get(blob.key, { type: "json" })) as QRCodeRecord)
  );

  const enriched = await Promise.all(
    records.map(async (record) => ({
      ...record,
      _count: await getStatsFor(record.id)
    }))
  );

  return enriched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getQRCodeForUser(userId: string, id: string) {
  const key = buildUserKey(userId, id);
  const record = (await qrStore().get(key, { type: "json" })) as QRCodeRecord | null;
  return record ? { record, key } : null;
}

export async function createQRCode(params: {
  userId: string;
  name: string;
  targetUrl: string;
  friendlySlug?: string | null;
  code?: string | null;
}) {
  const id = randomUUID();
  const now = new Date().toISOString();
  const code = (params.code ?? "").trim() || generateCode(10);
  const friendlySlug = params.friendlySlug?.trim() || null;

  const codeKey = buildCodeKey(code);
  const existingCode = await indexStore().get(codeKey, { type: "json" });
  if (existingCode) {
    return { error: "Code already exists", status: 409 } as const;
  }

  if (friendlySlug) {
    const slugKey = buildSlugKey(friendlySlug);
    const existingSlug = await indexStore().get(slugKey, { type: "json" });
    if (existingSlug) {
      return { error: "Slug already exists", status: 409 } as const;
    }
  }

  const record: QRCodeRecord = {
    id,
    name: params.name,
    code,
    targetUrl: params.targetUrl,
    friendlySlug,
    isActive: true,
    createdById: params.userId,
    createdAt: now,
    updatedAt: now
  };

  const recordKey = buildUserKey(params.userId, id);

  await qrStore().setJSON(recordKey, record);
  await indexStore().setJSON(codeKey, { key: recordKey });

  if (friendlySlug) {
    await indexStore().setJSON(buildSlugKey(friendlySlug), { key: recordKey });
  }

  await statsStore().setJSON(buildStatsKey(id), { visits: 0 });

  return { record, stats: { visits: 0 } } as const;
}

export async function updateQRCode(params: {
  userId: string;
  id: string;
  name?: string;
  targetUrl?: string;
  friendlySlug?: string | null;
  isActive?: boolean;
}) {
  const found = await getQRCodeForUser(params.userId, params.id);
  if (!found) {
    return null;
  }

  const { record, key } = found;
  const nextSlug = params.friendlySlug === undefined ? record.friendlySlug : params.friendlySlug;

  if (nextSlug !== record.friendlySlug) {
    if (nextSlug) {
      const existingSlug = await indexStore().get(buildSlugKey(nextSlug), { type: "json" });
      if (existingSlug) {
        return { error: "Slug already exists", status: 409 } as const;
      }
    }

    if (record.friendlySlug) {
      await indexStore().delete(buildSlugKey(record.friendlySlug));
    }

    if (nextSlug) {
      await indexStore().setJSON(buildSlugKey(nextSlug), { key });
    }
  }

  const updated: QRCodeRecord = {
    ...record,
    name: params.name ?? record.name,
    targetUrl: params.targetUrl ?? record.targetUrl,
    friendlySlug: nextSlug ?? null,
    isActive: params.isActive ?? record.isActive,
    updatedAt: new Date().toISOString()
  };

  await qrStore().setJSON(key, updated);

  return updated;
}

export async function deleteQRCode(userId: string, id: string) {
  const found = await getQRCodeForUser(userId, id);
  if (!found) {
    return false;
  }

  const { record, key } = found;

  await qrStore().delete(key);
  await indexStore().delete(buildCodeKey(record.code));
  if (record.friendlySlug) {
    await indexStore().delete(buildSlugKey(record.friendlySlug));
  }

  await statsStore().delete(buildStatsKey(id));

  const { blobs } = await visitsStore().list({ prefix: `visit/${id}/` });
  await Promise.all(blobs.map((blob) => visitsStore().delete(blob.key)));

  return true;
}

export async function findQRCodeByCodeOrSlug(params: { code?: string; slug?: string }) {
  const key = params.slug ? buildSlugKey(params.slug) : params.code ? buildCodeKey(params.code) : null;
  if (!key) {
    return null;
  }

  const index = (await indexStore().get(key, { type: "json" })) as { key: string } | null;
  if (!index) {
    return null;
  }

  const record = (await qrStore().get(index.key, { type: "json" })) as QRCodeRecord | null;
  return record;
}

export async function recordVisit(params: {
  qrCodeId: string;
  userAgent?: string | null;
  referrer?: string | null;
  ip?: string | null;
}) {
  const visitedAt = new Date().toISOString();
  const visit: QRVisit = {
    id: randomUUID(),
    qrCodeId: params.qrCodeId,
    visitedAt,
    userAgent: params.userAgent ?? null,
    referrer: params.referrer ?? null,
    ipHash: hashIp(params.ip)
  };

  await visitsStore().setJSON(buildVisitKey(params.qrCodeId, visitedAt), visit);

  const stats = await getStatsFor(params.qrCodeId);
  await statsStore().setJSON(buildStatsKey(params.qrCodeId), {
    visits: stats.visits + 1
  });
}

export async function listRecentVisits(qrCodeId: string, limit = 50) {
  const { blobs } = await visitsStore().list({ prefix: `visit/${qrCodeId}/` });
  const sortedKeys = blobs.map((blob) => blob.key).sort().reverse().slice(0, limit);

  const visits = await Promise.all(
    sortedKeys.map(async (key) => (await visitsStore().get(key, { type: "json" })) as QRVisit)
  );

  return visits;
}

export async function getVisitCount(qrCodeId: string) {
  const stats = await getStatsFor(qrCodeId);
  return stats.visits;
}
