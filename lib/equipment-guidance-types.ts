/** Shared with UI and API — keep free of Mongoose imports. */
export const GUIDANCE_CATEGORY_VALUES = [
  "datasheet",
  "user_manual",
  "installation_manual",
  "commissioning_manual",
] as const;

export type GuidanceCategory = (typeof GUIDANCE_CATEGORY_VALUES)[number];
