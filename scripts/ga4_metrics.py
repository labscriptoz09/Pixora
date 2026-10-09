#!/usr/bin/env python3
import json, os, sys
from datetime import datetime, timedelta

try:
    from google.analytics.data_v1beta import BetaAnalyticsDataClient
    from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Metric, Dimension
except ImportError:
    print("❌ Module google-analytics-data manquant")
    sys.exit(1)

PROPERTY_ID = os.environ.get("GA4_PROPERTY_ID", "547165953")
KEY_FILE = os.environ.get("GA4_KEY_FILE", "/home/userland/Pixora/scripts/ga4-key.json")

def get_metrics():
    try:
        client = BetaAnalyticsDataClient.from_service_account_json(KEY_FILE)
    except FileNotFoundError:
        print(f"❌ Clé GA4 introuvable: {KEY_FILE}")
        sys.exit(1)

    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    today = datetime.now().strftime("%Y-%m-%d")

    request = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        date_ranges=[DateRange(start_date=yesterday, end_date=today)],
        metrics=[
            Metric(name="sessions"),
            Metric(name="engagedSessions"),
            Metric(name="averageSessionDuration"),
            Metric(name="screenPageViews"),
            Metric(name="bounceRate"),
        ],
        dimensions=[Dimension(name="sessionSource")],
    )

    response = client.run_report(request)
    results = []
    for row in response.rows:
        results.append({
            "source": row.dimension_values[0].value,
            "sessions": int(row.metric_values[0].value),
            "engaged": int(row.metric_values[1].value),
            "avg_duration": round(float(row.metric_values[2].value), 1),
            "pageviews": int(row.metric_values[3].value),
            "bounce_rate": round(float(row.metric_values[4].value) * 100, 1),
        })

    total_sessions = sum(r["sessions"] for r in results)
    total_engaged = sum(r["engaged"] for r in results)
    engagement_pct = round((total_engaged / total_sessions * 100), 1) if total_sessions > 0 else 0

    report = {
        "date": yesterday,
        "generated_at": datetime.now().isoformat(),
        "totals": {
            "sessions": total_sessions,
            "engaged_sessions": total_engaged,
            "engagement_pct": engagement_pct,
            "total_pageviews": sum(r["pageviews"] for r in results),
        },
        "by_source": sorted(results, key=lambda x: x["sessions"], reverse=True)[:10],
    }

    out_file = os.path.join(os.path.dirname(__file__), "..", "ga4-latest.json")
    with open(out_file, "w") as f:
        json.dump(report, f, indent=2)

    print(f"✅ GA4 Rapport: {total_sessions} sessions, {engagement_pct}% engagement")
    print(f"📄 Sauvegardé: {out_file}")
    return report

if __name__ == "__main__":
    get_metrics()
