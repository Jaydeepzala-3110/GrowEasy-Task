export const CRM_STATUSES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof CRM_STATUSES)[number];
export type DataSource = (typeof DATA_SOURCES)[number];

export interface CrmLead {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: string;
  crm_note: string;
  data_source: string;
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  rowIndex: number;
  rawData: Record<string, string>;
  reason: string;
}

export interface ImportResult {
  imported: CrmLead[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
}

export interface ProgressEvent {
  type: "progress" | "complete" | "error";
  message: string;
  currentBatch?: number;
  totalBatches?: number;
  importedSoFar?: number;
  skippedSoFar?: number;
  result?: ImportResult;
}
