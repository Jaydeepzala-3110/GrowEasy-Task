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

export interface ParsedCsvPreview {
  headers: string[];
  rows: Record<string, string>[];
  fileName: string;
}

export type AppStep = "upload" | "preview" | "processing" | "results";

export const CRM_COLUMNS: { key: keyof CrmLead; label: string }[] = [
  { key: "created_at", label: "Created At" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Country Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Lead Owner" },
  { key: "crm_status", label: "CRM Status" },
  { key: "crm_note", label: "CRM Note" },
  { key: "data_source", label: "Data Source" },
  { key: "possession_time", label: "Possession Time" },
  { key: "description", label: "Description" },
];
