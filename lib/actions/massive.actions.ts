"use server";

const MASSIVE_BASE_URL = "https://api.massive.com";
const MASSIVE_API_KEY = process.env.NEXT_PUBLIC_MASSIVE_API_KEY;

async function fetchJSON(url: string, revalidateSeconds?: number) {
  const options: RequestInit = revalidateSeconds
    ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
    : { cache: "no-store" };

  const finalUrl = new URL(url);
  finalUrl.searchParams.set("apiKey", MASSIVE_API_KEY || "");

  const response = await fetch(finalUrl.toString(), options);

  if (!response.ok) {
    throw new Error(
      `Massive API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

interface MassiveArticle {
  id: string;
  publisher: {
    name: string;
    homepage_url?: string;
    logo_url?: string;
  };
  title: string;
  author: string;
  published_utc: string;
  article_url: string;
  tickers: string[];
  description: string;
  image_url: string;
}

export const getNews = async (symbols?: string[]): Promise<any[]> => {
  try {
    if (!MASSIVE_API_KEY) {
      throw new Error("Missing Massive API Key");
    }

    if (symbols && symbols.length > 0) {
      const cleanSymbols = symbols.map((s) => s.trim().toUpperCase());
      const allNews: any[] = [];
      const maxRounds = 6;
      const seenIds = new Set<string>();

      // Round-robin fetching logic as requested
      for (let i = 0; i < maxRounds; i++) {
        const symbol = cleanSymbols[i % cleanSymbols.length];
        try {
          // Massive v2 news endpoint filtering by ticker
          const url = `${MASSIVE_BASE_URL}/v2/reference/news?ticker=${symbol}&limit=5`;
          const data = await fetchJSON(url, 3600); // Cache for 1 hour
          const articles: MassiveArticle[] = data.results || [];

          // Find a valid article not already in the list
          const validArticle = articles.find(
            (a) => a.title && a.article_url && !seenIds.has(a.id)
          );

          if (validArticle) {
            seenIds.add(validArticle.id);
            allNews.push({
              id: validArticle.id,
              headline: validArticle.title,
              url: validArticle.article_url,
              datetime: Math.floor(
                new Date(validArticle.published_utc).getTime() / 1000
              ),
              image: validArticle.image_url,
              summary: validArticle.description,
              source: validArticle.publisher.name,
              tickers: validArticle.tickers,
            });
          }
        } catch (err) {
          console.error(`Error fetching news for ${symbol}:`, err);
        }

        if (allNews.length >= 6) break;
      }

      return allNews.sort((a, b) => b.datetime - a.datetime);
    } else {
      // General market news
      const url = `${MASSIVE_BASE_URL}/v2/reference/news?limit=20`;
      const data = await fetchJSON(url, 1800); // 30 min cache
      const articles: MassiveArticle[] = data.results || [];

      const seen = new Set();
      const formatted = articles
        .filter((a) => {
          if (!a.title || !a.article_url || seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        })
        .map((a) => ({
          id: a.id,
          headline: a.title,
          url: a.article_url,
          datetime: Math.floor(new Date(a.published_utc).getTime() / 1000),
          image: a.image_url,
          summary: a.description,
          source: a.publisher.name,
          tickers: a.tickers,
        }))
        .slice(0, 6);

      return formatted;
    }
  } catch (error) {
    console.error("Failed to fetch news from Massive:", error);
    throw new Error("Failed to fetch news");
  }
};
