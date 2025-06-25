import fetch from 'node-fetch';

export interface SerpApiResult {
  title: string;
  url: string;
  snippet: string;
  date_published?: string;
}

export async function serpApiSearch(query: string, apiKey: string): Promise<SerpApiResult[]> {
  const endpoint = `https://serpapi.com/search.json?engine=google_light&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`SerpApi error: ${response.statusText}`);
  }
  const data = (await response.json()) as { organic_results?: any[] };
  if (!data.organic_results) return [];
  return data.organic_results.map((item: any) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet || '',
    date_published: item.date_published || undefined,
  }));
} 