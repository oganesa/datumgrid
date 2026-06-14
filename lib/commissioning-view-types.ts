export const CONFIGURABLE_COLUMNS = [
  { key: "projectNumber",     label: "Project Number",      projectOnly: true },
  { key: "projectName",       label: "Project Name",        projectOnly: true },
  { key: "description",       label: "Description",         projectOnly: false },
  { key: "assetNumber",       label: "Asset Number",        projectOnly: false },
  { key: "assetTypeName",     label: "Asset Type",          projectOnly: false },
  { key: "serviceAndPart",    label: "Service and Part",    projectOnly: false },
  { key: "parentAssetName",   label: "Parent Asset",        projectOnly: false },
  { key: "giai",              label: "GIAI",                projectOnly: false },
  { key: "orderedDate",       label: "Ordered Date",        projectOnly: false },
  { key: "installationDate",  label: "Installation Date",   projectOnly: false },
  { key: "purchasedDate",     label: "Purchased Date",      projectOnly: false },
  { key: "warrantyExpiration",label: "Warranty Expiration", projectOnly: false },
  { key: "customerName",      label: "Customer",            projectOnly: false },
  { key: "contact",           label: "Contact",             projectOnly: false },
  { key: "address",           label: "Address",             projectOnly: false },
] as const;

export type ColumnKey = (typeof CONFIGURABLE_COLUMNS)[number]["key"];

export const FILTER_FIELDS = [
  { key: "assetName", label: "Asset Name" },
  { key: "assetNumber", label: "Asset Number" },
  { key: "serviceAndPart", label: "Service and Part" },
  { key: "contact", label: "Contact" },
  { key: "customerName", label: "Customer" },
  { key: "parentAssetName", label: "Parent Asset" },
  { key: "projectNumber", label: "Project Number" },
  { key: "projectName", label: "Project Name" },
] as const;

export type FilterField = (typeof FILTER_FIELDS)[number]["key"];

export const FILTER_OPERATORS = [
  { key: "is", label: "Is" },
  { key: "isNot", label: "Is not" },
  { key: "contains", label: "Contains" },
  { key: "startsWith", label: "Starts with" },
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number]["key"];

export type ViewFilter = {
  field: FilterField;
  operator: FilterOperator;
  value: string;
};

/** columns: null → show all; array → show only listed keys (in order) */
export type SerializedView = {
  _id: string;
  name: string;
  description: string;
  filters: ViewFilter[];
  columns: ColumnKey[] | null;
};

export const ALL_ASSETS_VIEW_ID = "all-assets";

export const ALL_ASSETS_VIEW: SerializedView = {
  _id: ALL_ASSETS_VIEW_ID,
  name: "All assets",
  description: "All commissioning equipment with all columns",
  filters: [],
  columns: null,
};

export const DEFAULT_VIEW_STORAGE_KEY = "commissioning-default-view-id";
