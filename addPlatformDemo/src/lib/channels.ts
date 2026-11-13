export type Channel = "meta" | "google" | "amazon";

export const CHANNELS: Channel[] = ["meta", "google", "amazon"];

export const CHANNEL_LABEL: Record<Channel, string> = {
  meta: "Meta",
  google: "Google Ads",
  amazon: "Amazon DSP",
};

export const SHORT_CHANNEL: Record<Channel, string> = {
  meta: "meta",
  google: "gads",
  amazon: "amzn",
};

export function toExternalCampaignId(channel: Channel, platformId: string): string {
  return `${SHORT_CHANNEL[channel]}/${platformId}`;
}

export function channelOf(externalCampaignId: string): Channel {
  const short = externalCampaignId.split("/")[0];
  const channel = CHANNELS.find((c) => SHORT_CHANNEL[c] === short);
  if (!channel) throw new Error(`Unknown channel prefix in ${externalCampaignId}`);
  return channel;
}
