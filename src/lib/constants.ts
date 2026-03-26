export const APP_NAME = "Invosmith";
export const APP_TAGLINE = "AI Invoice & Proposal Generator for Indian Freelancers";
export const APP_DESCRIPTION =
  "Paste your messy project notes → get a professional, GST-compliant invoice or proposal PDF in 60 seconds.";

// Service categories
export const SERVICE_CATEGORIES = [
  { value: "designer", label: "Designer", icon: "Palette" },
  { value: "developer", label: "Developer", icon: "Code" },
  { value: "consultant", label: "Consultant", icon: "Briefcase" },
  { value: "photographer", label: "Photographer", icon: "Camera" },
  { value: "writer", label: "Content Writer", icon: "PenTool" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["value"];

// Document types
export const DOCUMENT_TYPES = [
  { value: "invoice", label: "Invoice" },
  { value: "proposal", label: "Proposal" },
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number]["value"];

// Plan limits
export const PLAN_LIMITS = {
  free: { documentsPerMonth: 3, label: "Free", price: 0 },
  pro: { documentsPerMonth: Infinity, label: "Pro", price: 199 },
  agency: { documentsPerMonth: Infinity, label: "Agency", price: 499 },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// GST
export const DEFAULT_GST_RATE = 18;
export const GST_HSN_CODES: Record<string, string> = {
  designer: "998314", // Graphic design services
  developer: "998314", // IT design and development
  consultant: "998311", // Management consulting
  photographer: "998393", // Photography services
  writer: "998395", // Content writing/authoring
};

// Indian states for GST
export const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
] as const;
