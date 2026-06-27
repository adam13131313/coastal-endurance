// First-touch attribution: capture UTM params + external referrer on landing,
// keep them in localStorage, and attach to the order at checkout. No customer
// friction, no manual step.

const KEY = "ce-attribution";

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer?: string;
  landed_at?: string;
}

export function captureAttribution() {
  try {
    if (localStorage.getItem(KEY)) return; // first meaningful touch wins
    const p = new URLSearchParams(window.location.search);
    const a: Attribution = {};
    const us = p.get("utm_source");
    const um = p.get("utm_medium");
    const uc = p.get("utm_campaign");
    if (us) a.utm_source = us.slice(0, 100);
    if (um) a.utm_medium = um.slice(0, 100);
    if (uc) a.utm_campaign = uc.slice(0, 100);
    const ref = document.referrer;
    if (ref && !ref.includes(window.location.hostname)) a.referrer = ref.slice(0, 300);
    if (Object.keys(a).length > 0) {
      a.landed_at = new Date().toISOString();
      localStorage.setItem(KEY, JSON.stringify(a));
    }
  } catch {
    /* ignore */
  }
}

export function getAttribution(): Attribution | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : undefined;
  } catch {
    return undefined;
  }
}
