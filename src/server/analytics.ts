import { BetaAnalyticsDataClient } from '@google-analytics/data';

export type AnalyticsSummary = {
	users: number;
	sessions: number;
	views: number;
	topPages: { path: string; title: string; views: number }[];
	sources: { source: string; sessions: number }[];
};

export async function getAnalyticsSummary(startDate = '28daysAgo', endDate = 'today'): Promise<AnalyticsSummary | null> {
	const propertyId = import.meta.env.GA4_PROPERTY_ID;
	const rawCredentials = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON;
	if (!propertyId || !rawCredentials) return null;
	const credentials = JSON.parse(rawCredentials);
	const client = new BetaAnalyticsDataClient({ credentials });
	const [summary, pages, sources] = await Promise.all([
		client.runReport({
			property: `properties/${propertyId}`,
			dateRanges: [{ startDate, endDate }],
			metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
		}),
		client.runReport({
			property: `properties/${propertyId}`,
			dateRanges: [{ startDate, endDate }],
			dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
			metrics: [{ name: 'screenPageViews' }],
			orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
			limit: 8,
		}),
		client.runReport({
			property: `properties/${propertyId}`,
			dateRanges: [{ startDate, endDate }],
			dimensions: [{ name: 'sessionDefaultChannelGroup' }],
			metrics: [{ name: 'sessions' }],
			orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
			limit: 8,
		}),
	]);
	const metrics = summary[0].rows?.[0]?.metricValues ?? [];
	return {
		users: Number(metrics[0]?.value ?? 0),
		sessions: Number(metrics[1]?.value ?? 0),
		views: Number(metrics[2]?.value ?? 0),
		topPages: (pages[0].rows ?? []).map((row) => ({
			path: row.dimensionValues?.[0]?.value ?? '/',
			title: row.dimensionValues?.[1]?.value ?? 'Sin título',
			views: Number(row.metricValues?.[0]?.value ?? 0),
		})),
		sources: (sources[0].rows ?? []).map((row) => ({
			source: row.dimensionValues?.[0]?.value ?? 'Sin definir',
			sessions: Number(row.metricValues?.[0]?.value ?? 0),
		})),
	};
}
