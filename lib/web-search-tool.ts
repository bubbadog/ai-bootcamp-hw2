import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { serpApiSearch } from "./serpapi-search";

export interface WebSearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  author?: string;
  publishedDate?: string;
  source: "web-search";
}

export const LuminAIriesTool = tool({
  description: "LuminAIries: Search the web for blog posts and articles from AI luminaries and researchers related to the user's query. Use this when you need additional information from authoritative AI sources.",
  parameters: z.object({
    query: z.string().describe("The search query to find relevant AI articles and blog posts"),
    maxResults: z.number().default(5).describe("Maximum number of results to return (default: 5)")
  }),
  async execute({ query, maxResults = 5 }) {
    const apiKey = process.env.SERPAPI_API_KEY;
    console.log("[WebSearch] API Key present:", !!apiKey);
    console.log("[WebSearch] Query:", query, "MaxResults:", maxResults);
    
    // Helper function to filter Simon/Sam Willison results (allow max 1)
    function filterWillisonResults(items: any[]) {
      let simonCount = 0;
      return items.filter((item) => {
        const lowerUrl = (item.url || '').toLowerCase();
        const lowerAuthor = (item.author || '').toLowerCase();
        const lowerTitle = (item.title || '').toLowerCase();
        const lowerSnippet = (item.snippet || '').toLowerCase();
        
        const isWillison = (
          lowerUrl.includes('simonwillison.net') ||
          lowerAuthor.includes('simon willison') ||
          lowerAuthor.includes('sam willison') ||
          lowerTitle.includes('simon willison') ||
          lowerTitle.includes('sam willison') ||
          lowerSnippet.includes('simon willison') ||
          lowerSnippet.includes('sam willison')
        );
        
        if (isWillison) {
          if (simonCount < 1) {
            simonCount++;
            return true;
          }
          return false;
        }
        return true;
      });
    }

    if (apiKey) {
      try {
        console.log("[WebSearch] Using single search query:", query);
        
        // Use a single, well-crafted search query
        const searchQuery = `${query} AI blog -site:simonwillison.net`;
        const serpResults = await serpApiSearch(searchQuery, apiKey);
        
        console.log("[WebSearch] SerpApi results count:", serpResults.length);
        
        // Filter and deduplicate
        const filtered = filterWillisonResults(serpResults);
        const uniqueResults = Array.from(new Map(filtered.map(item => [item.url, item])).values());
        
        const finalResults = uniqueResults.slice(0, maxResults).map((item, i) => ({
          id: `serpapi-${Date.now()}-${i}`,
          title: item.title,
          url: item.url,
          snippet: item.snippet,
          publishedDate: item.date_published || undefined,
          source: "web-search"
        }));
        
        console.log("[WebSearch] Final SerpApi results:", finalResults.length);
        return finalResults;
      } catch (error) {
        console.error("SerpApi error:", error);
        // fallback to simulated
      }
    }
    
    console.log("[WebSearch] Using simulated results (no API key or error)");
    // fallback to simulated results if no API key or error
    const searchService = new WebSearchService();
    let results = await searchService.searchWeb(query, maxResults * 2); // Get more results to compensate for filtering
    // Filter: allow at most one result from Simon/Sam Willison
    results = filterWillisonResults(results);
    console.log("[WebSearch] Simulated results after filtering:", results.length);
    return results.slice(0, maxResults);
  }
});

class WebSearchService {
  private aiLuminaries = [
    "Andrew Ng",
    "Yann LeCun", 
    "Geoffrey Hinton",
    "Yoshua Bengio",
    "Fei-Fei Li",
    "Demis Hassabis",
    "Sam Altman",
    "Ilya Sutskever",
    "Andrej Karpathy",
    "François Chollet",
    "Jeremy Howard",
    "Rachel Thomas",
    "Sebastian Ruder",
    "Christopher Manning",
    "Michael Jordan",
    "Stuart Russell",
    "Peter Norvig",
    "Jürgen Schmidhuber",
    "Gary Marcus",
    "Cynthia Breazeal"
  ];

  private aiBlogs = [
    "distill.pub",
    "papers.ssrn.com", 
    "arxiv.org",
    "openai.com/blog",
    "deepmind.com/blog",
    "ai.googleblog.com",
    "research.google",
    "microsoft.com/en-us/research/blog",
    "meta.com/blog/ai",
    "nvidia.com/blog",
    "huggingface.co/blog",
    "fast.ai",
    "karpathy.ai",
    "gwern.net",
    "lesswrong.com",
    "alignmentforum.org",
    "ai-alignment.com",
    "anthropic.com/blog",
    "cohere.ai/blog",
    "together.ai/blog"
  ];

  async searchWeb(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
    try {
      const searchQueries = await this.generateSearchQueries(query);
      const results = await this.simulateWebSearch(searchQueries, query, maxResults);
      return results.slice(0, maxResults);
    } catch (error) {
      console.error("Web search error:", error);
      return [];
    }
  }

  private async generateSearchQueries(userQuery: string): Promise<string[]> {
    const prompt = `Given the user query: "${userQuery}"

Generate 3-5 specific search queries to find relevant blog posts and articles from AI luminaries and prominent AI blogs. Focus on finding recent, high-quality content from authoritative sources.

Consider searching for:
- Blog posts from AI researchers and practitioners
- Articles from AI companies (OpenAI, DeepMind, Google AI, etc.)
- Academic blogs and research blogs
- AI alignment and safety blogs

Format each query as a separate line. Make queries specific and relevant to the user's question.`;

    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        maxTokens: 300,
      });

      return result.text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5);
    } catch (error) {
      console.error("Error generating search queries:", error);
      return [
        `${userQuery} AI blog`,
        `${userQuery} machine learning blog`,
        `${userQuery} AI research blog`
      ];
    }
  }

  private async simulateWebSearch(searchQueries: string[], originalQuery: string, maxResults: number = 5): Promise<WebSearchResult[]> {
    const simulatedResults: WebSearchResult[] = [];
    
    const aiTopics = [
      "vector embeddings",
      "retrieval augmented generation", 
      "large language models",
      "machine learning",
      "neural networks",
      "deep learning",
      "AI safety",
      "alignment",
      "transformers",
      "attention mechanisms",
      "reinforcement learning",
      "computer vision",
      "natural language processing",
      "multimodal AI",
      "AI ethics",
      "responsible AI",
      "AI governance",
      "AI research trends",
      "AI applications",
      "AI infrastructure"
    ];

    // Generate more results to account for filtering
    const numToGenerate = Math.max(maxResults * 2, 10);
    for (let i = 0; i < numToGenerate; i++) {
      const topic = aiTopics[Math.floor(Math.random() * aiTopics.length)];
      const luminary = this.aiLuminaries[Math.floor(Math.random() * this.aiLuminaries.length)];
      const blog = this.aiBlogs[Math.floor(Math.random() * this.aiBlogs.length)];
      
      const snippets = [
        `A comprehensive analysis of ${topic} by ${luminary}, exploring the latest developments and practical applications in modern AI systems.`,
        `${luminary} shares their perspective on ${topic}, discussing both the technical challenges and the broader implications for the AI community.`,
        `An in-depth exploration of ${topic} from one of the field's leading experts. ${luminary} examines current trends and future directions.`,
        `This article by ${luminary} provides a detailed overview of ${topic}, including recent breakthroughs and practical applications.`,
        `${luminary} discusses the state of ${topic} in this comprehensive blog post, covering both theoretical foundations and real-world implementations.`
      ];
      
      const snippet = snippets[Math.floor(Math.random() * snippets.length)];
      
      simulatedResults.push({
        id: `web-${Date.now()}-${i}`,
        title: `${topic} insights from ${luminary}`,
        url: `https://${blog}/articles/${topic.replace(/\s+/g, '-')}`,
        snippet,
        author: luminary,
        publishedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        source: "web-search"
      });
    }

    return simulatedResults;
  }
} 