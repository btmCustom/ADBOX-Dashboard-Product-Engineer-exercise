import { readFileSync } from "node:fs";
import path from "node:path";

export type Channel = "meta" | "google" | "amazon";

export const SHORT_CHANNEL: Record<Channel, string> = {
  meta: "meta",
  google: "gads",
  amazon: "amzn",
};

export interface NormalizedRow {
  date: string; // YYYY-MM-DD
  externalCampaignId: string; // `${shortChannel}/${platform campaign id}`, e.g. "gads/43800084505"
  campaignName: string;
  spend: number; // USD
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number; // USD
}

const DATA_DIR = path.join(process.cwd(), "..");

// `lead` and `offsite_conversion.fb_pixel_lead` report the same events; counting both double-counts.
// `lead` is the only action type with a matching entry in `action_values`.
export const META_CONVERSION_ACTION = "lead";

const MICROS_PER_USD = 1_000_000;

export function toExternalCampaignId(channel: Channel, platformId: string): string {
  return `${SHORT_CHANNEL[channel]}/${platformId}`;
}

export function channelOf(externalCampaignId: string): Channel {
  const short = externalCampaignId.split("/")[0];
  const channel = (Object.keys(SHORT_CHANNEL) as Channel[]).find((c) => SHORT_CHANNEL[c] === short);
  if (!channel) throw new Error(`Unknown channel prefix in ${externalCampaignId}`);
  return channel;
}

function toNumber(value: string | undefined, field: string): number {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) throw new Error(`Non-numeric ${field}: ${value}`);
  return n;
}

function parseCsv(text: string): Record<string, string>[] {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line, i) => {
    const cells = line.split(",");
    if (cells.length !== headers.length) {
      throw new Error(`CSV row ${i + 2}: expected ${headers.length} columns, got ${cells.length}`);
    }
    return Object.fromEntries(headers.map((h, j) => [h, cells[j].trim()]));
  });
}

function readData(file: string): string {
  return readFileSync(path.join(DATA_DIR, file), "utf8");
}

interface MetaAction {
  action_type: string;
  value: string;
}

interface MetaInsight {
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  clicks: string;
  actions?: MetaAction[];
  action_values?: MetaAction[];
  date_start: string;
}

function actionValue(actions: MetaAction[] | undefined, type: string): number {
  const match = actions?.find((a) => a.action_type === type);
  return match ? toNumber(match.value, type) : 0;
}

export function loadMeta(): NormalizedRow[] {
  const { data } = JSON.parse(readData("meta_insights.json")) as { data: MetaInsight[] };
  return data.map((r) => ({
    date: r.date_start,
    externalCampaignId: toExternalCampaignId("meta", r.campaign_id),
    campaignName: r.campaign_name,
    spend: toNumber(r.spend, "spend"),
    impressions: toNumber(r.impressions, "impressions"),
    clicks: toNumber(r.clicks, "clicks"),
    conversions: actionValue(r.actions, META_CONVERSION_ACTION),
    conversionValue: actionValue(r.action_values, META_CONVERSION_ACTION),
  }));
}

export function loadGoogle(): NormalizedRow[] {
  return parseCsv(readData("google_ads.csv")).map((r) => ({
    date: r["segments.date"],
    externalCampaignId: toExternalCampaignId("google", r["campaign.id"]),
    campaignName: r["campaign.name"],
    spend: toNumber(r["metrics.cost_micros"], "cost_micros") / MICROS_PER_USD,
    impressions: toNumber(r["metrics.impressions"], "impressions"),
    clicks: toNumber(r["metrics.clicks"], "clicks"),
    conversions: toNumber(r["metrics.conversions"], "conversions"),
    conversionValue: toNumber(r["metrics.conversions_value"], "conversions_value"),
  }));
}

function usDateToIso(mmddyyyy: string): string {
  const [mm, dd, yyyy] = mmddyyyy.split("/");
  if (!yyyy) throw new Error(`Bad Amazon date: ${mmddyyyy}`);
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

// Conversions use Amazon's 14-day off-Amazon attribution window, kept as reported.
export function loadAmazon(): NormalizedRow[] {
  return parseCsv(readData("amazon_dsp.csv")).map((r) => ({
    date: usDateToIso(r.date),
    externalCampaignId: toExternalCampaignId("amazon", r.orderId),
    campaignName: r.orderName,
    spend: toNumber(r.totalCost, "totalCost"),
    impressions: toNumber(r.impressions, "impressions"),
    clicks: toNumber(r.clickThroughs, "clickThroughs"),
    conversions: toNumber(r.offAmazonConversions14d, "offAmazonConversions14d"),
    conversionValue: toNumber(r.offAmazonConversionValue14d, "offAmazonConversionValue14d"),
  }));
}

export function loadAllRows(): NormalizedRow[] {
  return [...loadMeta(), ...loadGoogle(), ...loadAmazon()];
}
