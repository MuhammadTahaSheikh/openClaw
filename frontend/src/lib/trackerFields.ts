import type { TrackerRowInput } from "../api/tracker";

export const TRACKER_FIELDS: { key: keyof TrackerRowInput; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "name", label: "Name" },
  { key: "jobTitle", label: "Job Title" },
  { key: "employmentType", label: "Part-time/Full-time" },
  { key: "email", label: "Email" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "phone", label: "Phone" },
  { key: "source", label: "Source" },
  { key: "remarks", label: "Remarks" },
  { key: "connects", label: "Connects" },
  { key: "projectPrice", label: "Project Price" },
];

export const TRACKER_FIELD_KEYS = TRACKER_FIELDS.map((field) => field.key);

export const TRACKER_HEADERS = TRACKER_FIELDS.map((field) => field.label);
