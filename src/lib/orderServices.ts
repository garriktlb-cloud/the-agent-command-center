import { Camera, KeyRound, Sparkles, Home, Truck, type LucideIcon } from "lucide-react";

export type ServiceFieldType = "text" | "textarea" | "date" | "time" | "select" | "boolean" | "number";

export interface ServiceField {
  key: string;
  label: string;
  type: ServiceFieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  helpText?: string;
}

export interface ServiceTypeDef {
  id: string;
  label: string;
  short: string;
  category: "listing-prep";
  icon: LucideIcon;
  description: string;
  defaultTitle: (details: Record<string, any>) => string;
  fields: ServiceField[];
  /** Aliases the AI parser can match to this service from voice input */
  aliases: string[];
}

export const SERVICE_TYPES: ServiceTypeDef[] = [
  {
    id: "photography",
    label: "Photography",
    short: "Photos",
    category: "listing-prep",
    icon: Camera,
    description: "HDR photos, drone, twilight, virtual tours.",
    aliases: ["photo", "photos", "photography", "shoot", "photographer", "drone", "twilight", "virtual tour"],
    defaultTitle: (d) => `Photography${d.shoot_type ? ` — ${d.shoot_type}` : ""}`,
    fields: [
      {
        key: "shoot_type",
        label: "Shoot type",
        type: "select",
        required: true,
        options: [
          { value: "Standard HDR", label: "Standard HDR" },
          { value: "HDR + Drone", label: "HDR + Drone" },
          { value: "Twilight", label: "Twilight" },
          { value: "Full package (HDR + Drone + Twilight + Tour)", label: "Full package" },
        ],
      },
      { key: "preferred_date", label: "Preferred date", type: "date" },
      { key: "preferred_time", label: "Preferred time", type: "time" },
      { key: "access_instructions", label: "Access / lockbox notes", type: "textarea", placeholder: "Where to find the key, gate code, etc." },
      { key: "special_instructions", label: "Special instructions", type: "textarea", placeholder: "Rooms to highlight, things to avoid…" },
    ],
  },
  {
    id: "lockbox",
    label: "Lockbox",
    short: "Lockbox",
    category: "listing-prep",
    icon: KeyRound,
    description: "Install, remove, or relocate a lockbox.",
    aliases: ["lockbox", "lock box", "key box", "supra", "install lockbox", "remove lockbox"],
    defaultTitle: (d) => `Lockbox — ${d.action || "Install"}`,
    fields: [
      {
        key: "action",
        label: "Action",
        type: "select",
        required: true,
        options: [
          { value: "Install", label: "Install" },
          { value: "Remove", label: "Remove" },
          { value: "Relocate", label: "Relocate" },
        ],
      },
      { key: "needed_by", label: "Needed by", type: "date" },
      { key: "gate_code", label: "Gate / community code", type: "text", placeholder: "If applicable" },
      { key: "placement", label: "Placement notes", type: "text", placeholder: "Front door, side gate, hose bib…" },
      { key: "key_location", label: "Where is the key now?", type: "textarea" },
    ],
  },
  {
    id: "sign",
    label: "Sign install",
    short: "Sign",
    category: "listing-prep",
    icon: Home,
    description: "Yard sign install, removal, or rider swap.",
    aliases: ["sign", "yard sign", "for sale sign", "install sign", "remove sign", "rider", "post"],
    defaultTitle: (d) => `Sign — ${d.action || "Install"}`,
    fields: [
      {
        key: "action",
        label: "Action",
        type: "select",
        required: true,
        options: [
          { value: "Install", label: "Install" },
          { value: "Remove", label: "Remove" },
          { value: "Add rider", label: "Add rider" },
        ],
      },
      {
        key: "rider",
        label: "Rider",
        type: "select",
        options: [
          { value: "None", label: "None" },
          { value: "Coming Soon", label: "Coming Soon" },
          { value: "Open House", label: "Open House" },
          { value: "Under Contract", label: "Under Contract" },
          { value: "Sold", label: "Sold" },
        ],
      },
      { key: "needed_by", label: "Needed by", type: "date" },
      { key: "placement", label: "Placement notes", type: "textarea", placeholder: "Front yard right of driveway, HOA restrictions…" },
    ],
  },
  {
    id: "cleaning",
    label: "Cleaning",
    short: "Clean",
    category: "listing-prep",
    icon: Sparkles,
    description: "Pre-listing, move-out, or post-staging clean.",
    aliases: ["cleaning", "clean", "deep clean", "maid", "housekeeping", "move out clean"],
    defaultTitle: (d) => `Cleaning — ${d.clean_type || "Standard"}`,
    fields: [
      {
        key: "clean_type",
        label: "Clean type",
        type: "select",
        required: true,
        options: [
          { value: "Standard", label: "Standard" },
          { value: "Deep clean", label: "Deep clean" },
          { value: "Move-out", label: "Move-out" },
          { value: "Post-construction", label: "Post-construction" },
        ],
      },
      { key: "preferred_date", label: "Preferred date", type: "date" },
      { key: "sqft", label: "Approx square feet", type: "number" },
      { key: "windows", label: "Include windows?", type: "boolean" },
      { key: "appliances", label: "Inside appliances?", type: "boolean" },
      { key: "special_instructions", label: "Special instructions", type: "textarea" },
    ],
  },
  {
    id: "staging",
    label: "Staging",
    short: "Staging",
    category: "listing-prep",
    icon: Home,
    description: "Full or partial home staging.",
    aliases: ["staging", "stager", "stage", "furniture", "stage the home"],
    defaultTitle: (d) => `Staging — ${d.staging_type || "Full"}`,
    fields: [
      {
        key: "staging_type",
        label: "Staging type",
        type: "select",
        required: true,
        options: [
          { value: "Full", label: "Full home" },
          { value: "Partial", label: "Partial (key rooms)" },
          { value: "Vacant accent", label: "Vacant accent" },
          { value: "Consultation only", label: "Consultation only" },
        ],
      },
      { key: "preferred_date", label: "Install date", type: "date" },
      { key: "duration_months", label: "Rental duration (months)", type: "number" },
      { key: "rooms", label: "Rooms to stage", type: "text", placeholder: "Living, kitchen, primary bed…" },
      { key: "style_notes", label: "Style notes", type: "textarea" },
    ],
  },
];

export function getServiceById(id: string | null | undefined): ServiceTypeDef | undefined {
  if (!id) return undefined;
  return SERVICE_TYPES.find((s) => s.id === id);
}
