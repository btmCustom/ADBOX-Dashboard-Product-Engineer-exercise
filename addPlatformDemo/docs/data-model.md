# Data model

Each platform export is loaded by `addPlatformDemo/src/lib/ingest.ts` into one `NormalizedRow` per
campaign per day. Grain is the same everywhere: one row = one campaign (Amazon: order) on one date.

There is no separate channel column. The channel is the prefix of `externalCampaignId`, written as
`{shortChannel}/{platform campaign id}` (`meta/31480986460544234`, `gads/43800084505`, `amzn/3779101165048`),
and `channelOf()` reads it back. This also keeps IDs unique across platforms.

## Source schemas and the normalized row

Attribute comments show the raw column name where it differs from the entity field.

```mermaid
erDiagram
    META_INSIGHT ||--o{ META_ACTION : "actions[]"
    META_INSIGHT ||--o{ META_ACTION_VALUE : "action_values[]"
    META_INSIGHT ||--|| NORMALIZED_ROW : "loadMeta()"
    GOOGLE_ADS_ROW ||--|| NORMALIZED_ROW : "loadGoogle()"
    AMAZON_DSP_ROW ||--|| NORMALIZED_ROW : "loadAmazon()"

    META_INSIGHT {
        string campaign_id PK
        string campaign_name
        string spend "USD, as string"
        string impressions "as string"
        string clicks "as string"
        string reach "dropped"
        string date_start PK "YYYY-MM-DD"
        string date_stop "dropped, equals date_start"
    }
    META_ACTION {
        string action_type "link_click, landing_page_view, lead, offsite_conversion.fb_pixel_lead"
        string value "count"
    }
    META_ACTION_VALUE {
        string action_type "lead only"
        string value "USD"
    }
    GOOGLE_ADS_ROW {
        int campaign_id PK "campaign.id"
        string campaign_name "campaign.name"
        string campaign_status "campaign.status, dropped"
        date segments_date PK "segments.date, YYYY-MM-DD"
        int metrics_cost_micros "metrics.cost_micros"
        int metrics_impressions "metrics.impressions"
        int metrics_clicks "metrics.clicks"
        float metrics_conversions "metrics.conversions, fractional"
        float metrics_conversions_value "metrics.conversions_value"
    }
    AMAZON_DSP_ROW {
        string date PK "MM/DD/YYYY"
        int orderId PK
        string orderName
        float totalCost "USD"
        int impressions
        int clickThroughs
        int offAmazonConversions14d "14-day window"
        float offAmazonConversionValue14d "14-day window"
    }
    NORMALIZED_ROW {
        string date PK "YYYY-MM-DD"
        string externalCampaignId PK "meta/..., gads/..., amzn/..."
        string campaignName
        float spend "USD"
        int impressions
        int clicks
        float conversions
        float conversionValue "USD"
    }
```

## Column mapping: Meta

```mermaid
flowchart LR
    subgraph SRC["meta_insights.json, data[]"]
        m_date["date_start"]
        m_id["campaign_id"]
        m_name["campaign_name"]
        m_spend["spend"]
        m_impr["impressions"]
        m_clicks["clicks"]
        m_conv["actions[] where action_type = lead"]
        m_val["action_values[] where action_type = lead"]
        m_drop["not used: reach, date_stop,<br/>link_click (duplicates clicks),<br/>landing_page_view,<br/>offsite_conversion.fb_pixel_lead (duplicates lead)"]
    end
    subgraph OUT["NormalizedRow"]
        n_date["date"]
        n_id["externalCampaignId"]
        n_name["campaignName"]
        n_spend["spend"]
        n_impr["impressions"]
        n_clicks["clicks"]
        n_conv["conversions"]
        n_val["conversionValue"]
    end
    m_date -- "as is" --> n_date
    m_id -- "prefix meta/" --> n_id
    m_name -- "as is" --> n_name
    m_spend -- "string to number" --> n_spend
    m_impr -- "string to number" --> n_impr
    m_clicks -- "string to number" --> n_clicks
    m_conv -- ".value to number, 0 if absent" --> n_conv
    m_val -- ".value to number, 0 if absent" --> n_val
    classDef dropped fill:#f4f4f5,stroke:#a1a1aa,stroke-dasharray:4 3,color:#71717a
    class m_drop dropped
```

## Column mapping: Google Ads

```mermaid
flowchart LR
    subgraph SRC["google_ads.csv"]
        g_date["segments.date"]
        g_id["campaign.id"]
        g_name["campaign.name"]
        g_spend["metrics.cost_micros"]
        g_impr["metrics.impressions"]
        g_clicks["metrics.clicks"]
        g_conv["metrics.conversions"]
        g_val["metrics.conversions_value"]
        g_drop["not used: campaign.status<br/>(ENABLED on every row)"]
    end
    subgraph OUT["NormalizedRow"]
        n_date["date"]
        n_id["externalCampaignId"]
        n_name["campaignName"]
        n_spend["spend"]
        n_impr["impressions"]
        n_clicks["clicks"]
        n_conv["conversions"]
        n_val["conversionValue"]
    end
    g_date -- "as is" --> n_date
    g_id -- "prefix gads/" --> n_id
    g_name -- "as is" --> n_name
    g_spend -- "divide by 1,000,000" --> n_spend
    g_impr -- "to number" --> n_impr
    g_clicks -- "to number" --> n_clicks
    g_conv -- "to number, keeps fractions" --> n_conv
    g_val -- "to number" --> n_val
    classDef dropped fill:#f4f4f5,stroke:#a1a1aa,stroke-dasharray:4 3,color:#71717a
    class g_drop dropped
```

## Column mapping: Amazon DSP

```mermaid
flowchart LR
    subgraph SRC["amazon_dsp.csv"]
        a_date["date"]
        a_id["orderId"]
        a_name["orderName"]
        a_spend["totalCost"]
        a_impr["impressions"]
        a_clicks["clickThroughs"]
        a_conv["offAmazonConversions14d"]
        a_val["offAmazonConversionValue14d"]
    end
    subgraph OUT["NormalizedRow"]
        n_date["date"]
        n_id["externalCampaignId"]
        n_name["campaignName"]
        n_spend["spend"]
        n_impr["impressions"]
        n_clicks["clicks"]
        n_conv["conversions"]
        n_val["conversionValue"]
    end
    a_date -- "MM/DD/YYYY to YYYY-MM-DD" --> n_date
    a_id -- "prefix amzn/" --> n_id
    a_name -- "as is" --> n_name
    a_spend -- "to number" --> n_spend
    a_impr -- "to number" --> n_impr
    a_clicks -- "to number" --> n_clicks
    a_conv -- "to number, 14-day window kept" --> n_conv
    a_val -- "to number, 14-day window kept" --> n_val
```

## Notes

- Any non-numeric value, malformed Amazon date or CSV row with the wrong column count throws at load time
  rather than becoming 0.
- Conversion windows are not harmonized: Amazon is 14-day off-Amazon, Meta and Google are each
  platform's default attribution. Cross-channel CPA and ROAS compare numbers counted differently.
