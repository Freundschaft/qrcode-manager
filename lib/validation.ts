const ALLOWED_SCHEMES = ["http:", "https:", "tel:", "mailto:", "sms:"] as const;

export function validateTargetUrl(value: string) {
  if (!value) {
    return { ok: false, error: "Target URL is required" } as const;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "Invalid URL" } as const;
  }

  if (!ALLOWED_SCHEMES.includes(url.protocol as (typeof ALLOWED_SCHEMES)[number])) {
    return { ok: false, error: "Unsupported URL scheme" } as const;
  }

  return { ok: true } as const;
}
