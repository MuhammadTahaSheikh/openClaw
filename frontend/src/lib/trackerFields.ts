import type { TrackerRowInput } from "../api/tracker";

export const TRACKER_FIELDS: {
  key: keyof TrackerRowInput;
  label: string;
  tableLabel?: string;
  wide?: boolean;
}[] = [
  { key: "date", label: "Date" },
  { key: "name", label: "Name" },
  { key: "jobTitle", label: "Job Title" },
  { key: "employmentType", label: "Part-time/Full-time", tableLabel: "Type" },
  { key: "email", label: "Email", wide: true },
  { key: "linkedin", label: "LinkedIn", wide: true },
  { key: "phone", label: "Phone" },
  { key: "source", label: "Source", wide: true },
  { key: "remarks", label: "Remarks", wide: true },
  { key: "connects", label: "Connects" },
  { key: "projectPrice", label: "Project Price" },
];

export const TRACKER_FIELD_KEYS = TRACKER_FIELDS.map((field) => field.key);

export const TRACKER_HEADERS = TRACKER_FIELDS.map((field) => field.label);
