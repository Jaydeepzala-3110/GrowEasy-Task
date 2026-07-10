import { CRM_STATUSES, DATA_SOURCES, type CrmStatus, type DataSource } from "../types/crm.js";

/**
 * Single source of truth for human-readable → enum mappings.
 * Used by leadNormalizer AND generated into the AI system prompt.
 * Every target value MUST exist in CRM_STATUSES / DATA_SOURCES.
 */
export const STATUS_ALIAS_GROUPS: Record<CrmStatus, readonly string[]> = {
  GOOD_LEAD_FOLLOW_UP: [
    "follow up",
    "follow-up",
    "followup",
    "good lead",
    "good lead follow up",
    "interested",
    "hot lead",
    "qualified",
    "warm lead",
    "callback",
    "reschedule",
    "demo scheduled",
  ],
  DID_NOT_CONNECT: [
    "did not connect",
    "no answer",
    "no response",
    "busy",
    "not reachable",
    "unreachable",
    "voicemail",
    "no pick",
    "call later",
    "will try again",
    "not connected",
  ],
  BAD_LEAD: [
    "bad lead",
    "not interested",
    "rejected",
    "declined",
    "dead lead",
    "junk",
    "cold lead",
    "unqualified",
    "no budget",
  ],
  SALE_DONE: [
    "sale done",
    "closed won",
    "sold",
    "deal closed",
    "converted",
    "won",
    "onboarding",
    "closed",
    "purchase done",
  ],
} as const;

export const SOURCE_ALIAS_GROUPS: Record<DataSource, readonly string[]> = {
  leads_on_demand: ["leads on demand", "lead on demand", "lod", "demand leads"],
  meridian_tower: ["meridian tower", "meridian", "meridian towers"],
  eden_park: ["eden park"],
  varah_swamy: ["varah swamy", "varaha swamy", "varahswamy"],
  sarjapur_plots: ["sarjapur plots", "sarjapur plot", "sarjapur"],
} as const;

function normalizeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildStatusAliases(): Record<string, CrmStatus> {
  const aliases: Record<string, CrmStatus> = {};
  for (const status of CRM_STATUSES) {
    aliases[normalizeKey(status)] = status;
    for (const label of STATUS_ALIAS_GROUPS[status]) {
      aliases[normalizeKey(label)] = status;
    }
  }
  return aliases;
}

export function buildSourceAliases(): Record<string, DataSource> {
  const aliases: Record<string, DataSource> = {};
  for (const source of DATA_SOURCES) {
    aliases[normalizeKey(source)] = source;
    for (const label of SOURCE_ALIAS_GROUPS[source]) {
      aliases[normalizeKey(label)] = source;
    }
  }
  return aliases;
}

export function formatStatusMappingTable(): string {
  return CRM_STATUSES.map(
    (status) => `| ${STATUS_ALIAS_GROUPS[status].join(", ")} | ${status} |`,
  ).join("\n");
}

export function formatSourceMappingTable(): string {
  return DATA_SOURCES.map(
    (source) => `| ${SOURCE_ALIAS_GROUPS[source].join(", ")} | ${source} |`,
  ).join("\n");
}

/** Assert every alias group key is a valid enum — call in tests. */
export function assertMappingIntegrity(): void {
  for (const status of CRM_STATUSES) {
    if (!STATUS_ALIAS_GROUPS[status]) {
      throw new Error(`Missing STATUS_ALIAS_GROUPS entry for ${status}`);
    }
  }
  for (const source of DATA_SOURCES) {
    if (!SOURCE_ALIAS_GROUPS[source]) {
      throw new Error(`Missing SOURCE_ALIAS_GROUPS entry for ${source}`);
    }
  }
  for (const aliases of Object.values(buildStatusAliases())) {
    if (!CRM_STATUSES.includes(aliases)) {
      throw new Error(`Status alias targets invalid enum: ${aliases}`);
    }
  }
  for (const aliases of Object.values(buildSourceAliases())) {
    if (!DATA_SOURCES.includes(aliases)) {
      throw new Error(`Source alias targets invalid enum: ${aliases}`);
    }
  }
}
