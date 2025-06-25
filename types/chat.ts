export interface ChatSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  relevancy?: number;
  similarity?: number;
  source?: "vector" | "web-search";
  author?: string;
  publishedDate?: string;
}

export interface WebSearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  author?: string;
  publishedDate?: string;
  source: "web-search";
}

export interface ChatMessageWithSources {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  webSources?: WebSearchSource[];
  createdAt: string | Date;
}
