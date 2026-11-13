export interface InternalCampaign {
  id: string;
  name: string;
  // Tested against Campaign.normalizedName (lowercase, words separated by single spaces).
  patterns: RegExp[];
}

export const INTERNAL_CAMPAIGNS: InternalCampaign[] = [
  {
    id: "fall-rate-promo",
    name: "Fall Rate Promo",
    patterns: [/\bfall ?rate\b/, /\bfall promo\b/],
  },
  {
    id: "checking-account-launch",
    name: "Checking Account Launch",
    patterns: [/\b(checking|chk)( acct| account)? launch\b/],
  },
  {
    id: "home-equity-spring",
    name: "Home Equity Spring",
    patterns: [/\b(home ?equity|he) spring\b/],
  },
];
