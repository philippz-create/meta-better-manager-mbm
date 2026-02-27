// ── Meta API Types ──

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

// ── Campaign ──

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
export type CampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_SALES"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_APP_PROMOTION";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: CampaignObjective;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  updated_time: string;
  buying_type?: string;
  special_ad_categories: string[];
  insights?: CampaignInsights;
}

export interface CreateCampaignPayload {
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  special_ad_categories: string[];
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

// ── Ad Set ──

export type AdSetStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
export type BillingEvent = "IMPRESSIONS" | "LINK_CLICKS" | "APP_INSTALLS";
export type OptimizationGoal =
  | "REACH"
  | "IMPRESSIONS"
  | "LINK_CLICKS"
  | "LANDING_PAGE_VIEWS"
  | "LEAD_GENERATION"
  | "CONVERSIONS"
  | "VALUE";

export interface AdSet {
  id: string;
  name: string;
  status: AdSetStatus;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  billing_event: BillingEvent;
  optimization_goal: OptimizationGoal;
  targeting?: Targeting;
  created_time: string;
  updated_time: string;
}

export interface Targeting {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    cities?: { key: string; name: string }[];
  };
  interests?: { id: string; name: string }[];
  locales?: number[];
}

export interface CreateAdSetPayload {
  name: string;
  campaign_id: string;
  status: AdSetStatus;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  end_time?: string;
  billing_event: BillingEvent;
  optimization_goal: OptimizationGoal;
  targeting: Targeting;
}

// ── Ad ──

export type AdStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export interface Ad {
  id: string;
  name: string;
  status: AdStatus;
  adset_id: string;
  campaign_id: string;
  creative: { id: string };
  created_time: string;
  updated_time: string;
}

export interface CreateAdPayload {
  name: string;
  adset_id: string;
  status: AdStatus;
  creative: { creative_id: string };
}

// ── Ad Creative ──

export interface AdCreative {
  id: string;
  name: string;
  title?: string;
  body?: string;
  image_hash?: string;
  image_url?: string;
  link_url?: string;
  call_to_action_type?: string;
  thumbnail_url?: string;
}

// ── Media / Ad Image ──

export interface AdImage {
  hash: string;
  url: string;
  name: string;
  width?: number;
  height?: number;
  created_time?: string;
}

export interface AdVideo {
  id: string;
  title?: string;
  description?: string;
  source?: string;
  picture?: string;
  created_time?: string;
  updated_time?: string;
  length?: number;
}

// ── Insights ──

export interface CampaignInsights {
  impressions: string;
  clicks?: string;
  spend: string;
  reach?: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  actions?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

// ── Account ──

export interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  amount_spent: string;
  balance: string;
  spend_cap?: string;
}

// ── Pagination ──

export interface MetaPaginatedResponse<T> {
  data: T[];
  paging?: {
    cursors?: { before: string; after: string };
    next?: string;
    previous?: string;
  };
}
