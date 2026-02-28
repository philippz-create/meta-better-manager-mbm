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

export type BuyingType = "AUCTION" | "RESERVED";

export type BidStrategy =
  | "LOWEST_COST_WITHOUT_CAP"
  | "LOWEST_COST_WITH_BID_CAP"
  | "COST_CAP";

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
  bid_strategy?: string;
  special_ad_categories: string[];
  insights?: CampaignInsights;
}

export interface CreateCampaignPayload {
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  special_ad_categories: string[];
  buying_type?: BuyingType;
  bid_strategy?: BidStrategy;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  is_adset_budget_sharing_enabled?: boolean;
}

// ── Ad Set ──

export type AdSetStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";

export type BillingEvent =
  | "IMPRESSIONS"
  | "LINK_CLICKS"
  | "APP_INSTALLS"
  | "THRUPLAY";

export type OptimizationGoal =
  | "REACH"
  | "IMPRESSIONS"
  | "LINK_CLICKS"
  | "LANDING_PAGE_VIEWS"
  | "LEAD_GENERATION"
  | "CONVERSIONS"
  | "OFFSITE_CONVERSIONS"
  | "VALUE"
  | "POST_ENGAGEMENT"
  | "PAGE_LIKES"
  | "THRUPLAY"
  | "APP_INSTALLS"
  | "AD_RECALL_LIFT"
  | "QUALITY_LEAD";

export type DestinationType =
  | "WEBSITE"
  | "APP"
  | "MESSENGER"
  | "INSTAGRAM_DIRECT"
  | "WHATSAPP"
  | "PHONE_CALL"
  | "ON_AD"
  | "ON_POST"
  | "ON_EVENT"
  | "ON_PAGE"
  | "ON_VIDEO"
  | "SHOP_AUTOMATIC"
  | "UNDEFINED";

export interface PromotedObject {
  pixel_id?: string;
  custom_event_type?: string;
  page_id?: string;
  application_id?: string;
  object_store_url?: string;
  offer_id?: string;
}

export interface Targeting {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    regions?: { key: string; name?: string }[];
    cities?: { key: string; name?: string; radius?: number; distance_unit?: string }[];
    zips?: { key: string }[];
    location_types?: string[];
  };
  interests?: { id: string; name: string }[];
  behaviors?: { id: string; name: string }[];
  custom_audiences?: { id: string; name?: string }[];
  excluded_custom_audiences?: { id: string; name?: string }[];
  locales?: number[];
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  audience_network_positions?: string[];
  messenger_positions?: string[];
  device_platforms?: string[];
  flexible_spec?: Array<{
    interests?: { id: string; name: string }[];
    behaviors?: { id: string; name: string }[];
  }>;
  exclusions?: {
    interests?: { id: string; name: string }[];
    behaviors?: { id: string; name: string }[];
  };
}

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
  destination_type?: DestinationType;
  promoted_object?: PromotedObject;
  bid_amount?: string;
  bid_strategy?: string;
  attribution_spec?: Array<{ event_type: string; window_days: number }>;
  created_time: string;
  updated_time: string;
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
  destination_type?: DestinationType;
  promoted_object?: PromotedObject;
  bid_amount?: string;
  attribution_spec?: Array<{ event_type: string; window_days: number }>;
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
