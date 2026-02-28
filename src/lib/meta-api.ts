import type {
  AdAccount,
  AdCreative,
  AdImage,
  AdSet,
  Ad,
  Campaign,
  CampaignInsights,
  CreateAdPayload,
  CreateAdSetPayload,
  CreateCampaignPayload,
  MetaPaginatedResponse,
} from "./types";

const META_API_VERSION = "v21.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN is not configured");
  return token;
}

function getAdAccountId(): string {
  const id = process.env.META_AD_ACCOUNT_ID;
  if (!id) throw new Error("META_AD_ACCOUNT_ID is not configured");
  return id.startsWith("act_") ? id : `act_${id}`;
}

async function metaFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${META_API_BASE}${endpoint}`;

  const separator = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${separator}access_token=${getAccessToken()}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMessage =
      data?.error?.error_user_msg ||
      data?.error?.message ||
      `Meta API error: ${res.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}

// ── Account ──

export async function getAdAccount(): Promise<AdAccount> {
  const accountId = getAdAccountId();
  return metaFetch<AdAccount>(
    `/${accountId}?fields=id,account_id,name,account_status,currency,timezone_name,amount_spent,balance,spend_cap`
  );
}

// ── Campaigns ──

export async function getCampaigns(): Promise<
  MetaPaginatedResponse<Campaign>
> {
  const accountId = getAdAccountId();
  return metaFetch<MetaPaginatedResponse<Campaign>>(
    `/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,buying_type,bid_strategy,special_ad_categories&limit=50`
  );
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  return metaFetch<Campaign>(
    `/${campaignId}?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,buying_type,bid_strategy,special_ad_categories`
  );
}

export async function createCampaign(
  payload: CreateCampaignPayload
): Promise<{ id: string }> {
  const accountId = getAdAccountId();
  const params = new URLSearchParams();
  params.set("name", payload.name);
  params.set("objective", payload.objective);
  params.set("status", payload.status);
  params.set(
    "special_ad_categories",
    JSON.stringify(payload.special_ad_categories ?? [])
  );
  if (payload.buying_type) params.set("buying_type", payload.buying_type);
  if (payload.bid_strategy) params.set("bid_strategy", payload.bid_strategy);
  if (payload.daily_budget) params.set("daily_budget", payload.daily_budget);
  if (payload.lifetime_budget)
    params.set("lifetime_budget", payload.lifetime_budget);
  if (payload.start_time) params.set("start_time", payload.start_time);
  if (payload.stop_time) params.set("stop_time", payload.stop_time);
  if (payload.is_adset_budget_sharing_enabled !== undefined)
    params.set("is_adset_budget_sharing_enabled", String(payload.is_adset_budget_sharing_enabled));

  return metaFetch<{ id: string }>(`/${accountId}/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
}

export async function updateCampaign(
  campaignId: string,
  payload: Partial<CreateCampaignPayload>
): Promise<{ success: boolean }> {
  const params = new URLSearchParams();
  if (payload.name) params.set("name", payload.name);
  if (payload.status) params.set("status", payload.status);
  if (payload.daily_budget) params.set("daily_budget", payload.daily_budget);
  if (payload.lifetime_budget)
    params.set("lifetime_budget", payload.lifetime_budget);
  if (payload.bid_strategy) params.set("bid_strategy", payload.bid_strategy);

  return metaFetch<{ success: boolean }>(`/${campaignId}`, {
    method: "POST",
    body: params,
  });
}

export async function deleteCampaign(
  campaignId: string
): Promise<{ success: boolean }> {
  return metaFetch<{ success: boolean }>(`/${campaignId}`, {
    method: "DELETE",
  });
}

// ── Campaign Insights ──

export async function getCampaignInsights(
  campaignId: string,
  datePreset: string = "last_30d"
): Promise<MetaPaginatedResponse<CampaignInsights>> {
  return metaFetch<MetaPaginatedResponse<CampaignInsights>>(
    `/${campaignId}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,ctr,actions&date_preset=${datePreset}`
  );
}

export async function getAccountInsights(
  datePreset: string = "last_30d"
): Promise<MetaPaginatedResponse<CampaignInsights>> {
  const accountId = getAdAccountId();
  return metaFetch<MetaPaginatedResponse<CampaignInsights>>(
    `/${accountId}/insights?fields=impressions,clicks,spend,reach,cpc,cpm,ctr,actions&date_preset=${datePreset}`
  );
}

// ── Ad Sets ──

export async function getAdSets(
  campaignId?: string
): Promise<MetaPaginatedResponse<AdSet>> {
  const accountId = getAdAccountId();
  const base = campaignId ? `/${campaignId}` : `/${accountId}`;
  return metaFetch<MetaPaginatedResponse<AdSet>>(
    `${base}/adsets?fields=id,name,status,campaign_id,daily_budget,lifetime_budget,start_time,end_time,billing_event,optimization_goal,targeting,destination_type,promoted_object,bid_amount,created_time,updated_time&limit=50`
  );
}

export async function createAdSet(
  payload: CreateAdSetPayload
): Promise<{ id: string }> {
  const accountId = getAdAccountId();
  const params = new URLSearchParams();
  params.set("name", payload.name);
  params.set("campaign_id", payload.campaign_id);
  params.set("status", payload.status);
  params.set("billing_event", payload.billing_event);
  params.set("optimization_goal", payload.optimization_goal);
  params.set("targeting", JSON.stringify(payload.targeting));

  if (payload.daily_budget) params.set("daily_budget", payload.daily_budget);
  if (payload.lifetime_budget)
    params.set("lifetime_budget", payload.lifetime_budget);
  if (payload.start_time) params.set("start_time", payload.start_time);
  if (payload.end_time) params.set("end_time", payload.end_time);
  if (payload.destination_type)
    params.set("destination_type", payload.destination_type);
  if (payload.promoted_object)
    params.set("promoted_object", JSON.stringify(payload.promoted_object));
  if (payload.bid_amount) params.set("bid_amount", payload.bid_amount);
  if (payload.attribution_spec)
    params.set("attribution_spec", JSON.stringify(payload.attribution_spec));

  return metaFetch<{ id: string }>(`/${accountId}/adsets`, {
    method: "POST",
    body: params,
  });
}

export async function updateAdSet(
  adSetId: string,
  payload: Partial<CreateAdSetPayload>
): Promise<{ success: boolean }> {
  const params = new URLSearchParams();
  if (payload.name) params.set("name", payload.name);
  if (payload.status) params.set("status", payload.status);
  if (payload.daily_budget) params.set("daily_budget", payload.daily_budget);
  if (payload.lifetime_budget)
    params.set("lifetime_budget", payload.lifetime_budget);
  if (payload.targeting)
    params.set("targeting", JSON.stringify(payload.targeting));
  if (payload.bid_amount) params.set("bid_amount", payload.bid_amount);

  return metaFetch<{ success: boolean }>(`/${adSetId}`, {
    method: "POST",
    body: params,
  });
}

// ── Ads ──

export async function getAds(
  filterBy?: { adSetId?: string; campaignId?: string }
): Promise<MetaPaginatedResponse<Ad>> {
  const accountId = getAdAccountId();
  const base = filterBy?.adSetId
    ? `/${filterBy.adSetId}`
    : filterBy?.campaignId
    ? `/${filterBy.campaignId}`
    : `/${accountId}`;
  return metaFetch<MetaPaginatedResponse<Ad>>(
    `${base}/ads?fields=id,name,status,adset_id,campaign_id,creative,created_time,updated_time&limit=50`
  );
}

export async function createAd(
  payload: CreateAdPayload
): Promise<{ id: string }> {
  const accountId = getAdAccountId();
  const params = new URLSearchParams();
  params.set("name", payload.name);
  params.set("adset_id", payload.adset_id);
  params.set("status", payload.status);
  params.set("creative", JSON.stringify(payload.creative));

  return metaFetch<{ id: string }>(`/${accountId}/ads`, {
    method: "POST",
    body: params,
  });
}

// ── Ad Creatives ──

export async function getAdCreatives(): Promise<
  MetaPaginatedResponse<AdCreative>
> {
  const accountId = getAdAccountId();
  return metaFetch<MetaPaginatedResponse<AdCreative>>(
    `/${accountId}/adcreatives?fields=id,name,title,body,image_hash,image_url,link_url,call_to_action_type,thumbnail_url&limit=50`
  );
}

export interface CreateAdCreativePayload {
  name: string;
  object_story_spec: {
    page_id: string;
    link_data?: {
      image_hash?: string;
      link: string;
      message: string;
      name?: string;
      description?: string;
      call_to_action?: {
        type: string;
        value?: { link: string };
      };
    };
  };
}

export async function createAdCreative(
  payload: CreateAdCreativePayload
): Promise<{ id: string }> {
  const accountId = getAdAccountId();
  const params = new URLSearchParams();
  params.set("name", payload.name);
  params.set("object_story_spec", JSON.stringify(payload.object_story_spec));

  return metaFetch<{ id: string }>(`/${accountId}/adcreatives`, {
    method: "POST",
    body: params,
  });
}

// ── Media: Images ──

export async function getAdImages(): Promise<
  MetaPaginatedResponse<AdImage>
> {
  const accountId = getAdAccountId();
  return metaFetch<MetaPaginatedResponse<AdImage>>(
    `/${accountId}/adimages?fields=hash,url,name,width,height,created_time&limit=50`
  );
}

export async function uploadAdImage(
  imageBytes: Uint8Array,
  filename: string
): Promise<{ images: Record<string, AdImage> }> {
  const accountId = getAdAccountId();

  const formData = new FormData();
  const blob = new Blob([imageBytes as BlobPart]);
  formData.append("filename", blob, filename);

  const url = `${META_API_BASE}/${accountId}/adimages?access_token=${getAccessToken()}`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Image upload failed");
  }
  return data;
}

// ── Media: Videos ──

export async function uploadAdVideo(
  videoBytes: Uint8Array,
  filename: string,
  title?: string
): Promise<{ id: string }> {
  const accountId = getAdAccountId();

  const formData = new FormData();
  const blob = new Blob([videoBytes as BlobPart]);
  formData.append("source", blob, filename);
  if (title) formData.append("title", title);

  const url = `${META_API_BASE}/${accountId}/advideos?access_token=${getAccessToken()}`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Video upload failed");
  }
  return data;
}
