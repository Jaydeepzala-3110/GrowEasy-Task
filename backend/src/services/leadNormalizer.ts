import {
  CRM_STATUSES,
  DATA_SOURCES,
  type CrmLead,
} from "../types/crm.js";
import {
  buildSourceAliases,
  buildStatusAliases,
} from "../prompts/enumMappings.js";

const STATUS_ALIASES = buildStatusAliases();
const SOURCE_ALIASES = buildSourceAliases();

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Indian mobile: exactly 10 digits, first digit 6–9. */
export function isIndianMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}

export function escapeCrmNote(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n");
}

export function isValidCreatedAt(value: string): boolean {
  return tryParseDate(value) !== null;
}

/**
 * Parse dates with GrowEasy India default: DD/MM/YYYY for ambiguous slash dates.
 * Avoids native Date() on slash formats to prevent US MM/DD interpretation.
 */
function tryParseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // ISO / hyphen dates — safe for native Date
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  // DD/MM/YYYY or DD-MM-YYYY (India default — day first, month second)
  const dmyTime = trimmed.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i,
  );
  if (dmyTime) {
    const day = Number(dmyTime[1]);
    const month = Number(dmyTime[2]);
    const year = Number(dmyTime[3]);
    let hour = Number(dmyTime[4] ?? 0);
    const minute = Number(dmyTime[5] ?? 0);
    const second = Number(dmyTime[6] ?? 0);
    const meridiem = dmyTime[7]?.toUpperCase();

    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  const ymd = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (ymd) {
    const parsed = new Date(
      Number(ymd[1]),
      Number(ymd[2]) - 1,
      Number(ymd[3]),
      Number(ymd[4] ?? 0),
      Number(ymd[5] ?? 0),
      Number(ymd[6] ?? 0),
    );
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function normalizeCreatedAt(value: string): { value: string; overflow?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { value: "" };

  const parsed = tryParseDate(trimmed);
  if (parsed) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const normalized = `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
    return { value: normalized };
  }

  return { value: "", overflow: `Original date: ${trimmed}` };
}

export function normalizeCrmStatus(raw: string): { value: string; overflow?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: "" };

  if (CRM_STATUSES.includes(trimmed as (typeof CRM_STATUSES)[number])) {
    return { value: trimmed };
  }

  const mapped = STATUS_ALIASES[normalizeKey(trimmed)];
  if (mapped) return { value: mapped };

  const compact = trimmed.toUpperCase().replace(/[\s-]+/g, "_");
  if (CRM_STATUSES.includes(compact as (typeof CRM_STATUSES)[number])) {
    return { value: compact };
  }

  return { value: "", overflow: `Original status: ${trimmed}` };
}

export function normalizeDataSource(raw: string): { value: string; overflow?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { value: "" };

  if (DATA_SOURCES.includes(trimmed as (typeof DATA_SOURCES)[number])) {
    return { value: trimmed };
  }

  const mapped = SOURCE_ALIASES[normalizeKey(trimmed)];
  if (mapped) return { value: mapped };

  return { value: "", overflow: `Original source: ${trimmed}` };
}

function appendNote(existing: string, addition?: string): string {
  if (!addition) return existing;
  const combined = [existing, addition].filter(Boolean).join(" | ");
  return escapeCrmNote(combined);
}

function emptyLead(): CrmLead {
  return {
    created_at: "",
    name: "",
    email: "",
    country_code: "",
    mobile_without_country_code: "",
    company: "",
    city: "",
    state: "",
    country: "",
    lead_owner: "",
    crm_status: "",
    crm_note: "",
    data_source: "",
    possession_time: "",
    description: "",
  };
}

function normalizePhoneFields(lead: CrmLead): void {
  const rawMobile = lead.mobile_without_country_code.replace(/\D/g, "");
  const rawCombined = `${lead.country_code}${lead.mobile_without_country_code}`.replace(/\D/g, "");

  if (rawMobile.length === 12 && rawMobile.startsWith("91")) {
    const lastTen = rawMobile.slice(2);
    if (isIndianMobile(lastTen)) {
      lead.country_code = "+91";
      lead.mobile_without_country_code = lastTen;
      return;
    }
  }

  lead.mobile_without_country_code = rawMobile;

  if (!lead.country_code && isIndianMobile(lead.mobile_without_country_code)) {
    lead.country_code = "+91";
  }

  if (lead.country_code && !lead.country_code.startsWith("+")) {
    lead.country_code = `+${lead.country_code.replace(/\D/g, "")}`;
  }
}

export function normalizeLead(raw: Partial<CrmLead>): CrmLead {
  const lead: CrmLead = { ...emptyLead(), ...raw };

  for (const key of Object.keys(lead) as (keyof CrmLead)[]) {
    lead[key] = lead[key] == null ? "" : String(lead[key]).trim();
  }

  const createdAt = normalizeCreatedAt(lead.created_at);
  lead.created_at = createdAt.value;
  lead.crm_note = appendNote(lead.crm_note, createdAt.overflow);

  const status = normalizeCrmStatus(lead.crm_status);
  lead.crm_status = status.value;
  lead.crm_note = appendNote(lead.crm_note, status.overflow);

  const source = normalizeDataSource(lead.data_source);
  lead.data_source = source.value;
  lead.crm_note = appendNote(lead.crm_note, source.overflow);

  normalizePhoneFields(lead);

  lead.crm_note = escapeCrmNote(lead.crm_note);
  lead.description = escapeCrmNote(lead.description);

  return lead;
}

export function isBlankRow(data: Record<string, string>): boolean {
  return Object.values(data).every((v) => !String(v ?? "").trim());
}

export function hasContact(lead: CrmLead): boolean {
  const hasEmail = Boolean(lead.email.trim());
  const digits = lead.mobile_without_country_code.replace(/\D/g, "");
  const hasMobile = isIndianMobile(digits) || digits.length >= 6;
  return hasEmail || hasMobile;
}
