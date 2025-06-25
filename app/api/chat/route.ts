import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { VectorizeService } from "@/lib/vectorize";
import { LuminAIriesTool } from "@/lib/web-search-tool";
import type { ChatSource, WebSearchSource } from "@/types/chat";
import { tool } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const userMessage = messages[messages.length - 1];
    let contextDocuments = "";
    let sources: ChatSource[] = [];
    let webSources: WebSearchSource[] = [];
    let webSearchResults: WebSearchSource[] = [];
    let ragTopics: string[] = [];

    // Always perform a web search in parallel using RAG topics
    const webSearchPromise = (async () => {
      try {
        // If we have RAG topics, search for each and aggregate results
        let allResults: WebSearchSource[] = [];
        if (ragTopics.length > 0) {
          for (const topic of ragTopics) {
            const results = await LuminAIriesTool.execute({ query: topic, maxResults: 3 }, { toolCallId: 'manual', messages: [] });
            allResults = allResults.concat(results.map((result) => ({
              id: result.id,
              title: result.title,
              url: result.url,
              snippet: result.snippet,
              author: (result as any).author,
              publishedDate: result.publishedDate,
              source: "web-search" as const
            })));
          }
          // Filter: at most one result from simonwillison.net
          let simonFound = false;
          allResults = allResults.filter((item) => {
            if (item.url.includes('simonwillison.net')) {
              if (!simonFound) {
                simonFound = true;
                return true;
              }
              return false;
            }
            return true;
          });
          // Limit to 5 results total
          return allResults.slice(0, 5);
        } else {
          // fallback: use user message as query
          const webSearchToolResult = await LuminAIriesTool.execute({ query: userMessage?.content || '', maxResults: 5 }, { toolCallId: 'manual', messages: [] });
          return webSearchToolResult.map((result) => ({
            id: result.id,
            title: result.title,
            url: result.url,
            snippet: result.snippet,
            author: (result as any).author,
            publishedDate: result.publishedDate,
            source: "web-search" as const
          }));
        }
      } catch (e) {
        return [];
      }
    })();

    if (userMessage?.role === "user" && userMessage?.content) {
      try {
        // Get vectorized documents
        const vectorizeService = new VectorizeService();
        const documents = await vectorizeService.retrieveDocuments(
          userMessage.content
        );
        console.log("[RAG] Retrieved documents:", documents);
        contextDocuments =
          vectorizeService.formatDocumentsForContext(documents);
        console.log("[RAG] Formatted context:", contextDocuments);
        sources = vectorizeService.convertDocumentsToChatSources(documents);
        // Extract topics from the top 3 RAG documents (use their text fields)
        ragTopics = documents.slice(0, 3).map(doc => doc.text.split(". ")[0]);
      } catch (vectorizeError) {
        console.error("Vectorize retrieval failed:", vectorizeError);
        contextDocuments =
          "Unable to retrieve relevant documents at this time.";
        sources = [];
      }
    }

    const systemPrompt = `You are a helpful AI assistant that specializes in answering questions based on sources.

When answering questions, you MUST use the following context documents to provide accurate and relevant information. If you use information from a context document, cite it using [Source X] where X is the document number. If the context does not contain the answer, say so and do NOT make up information.

=== CONTEXT DOCUMENTS ===
${contextDocuments}
=== END CONTEXT DOCUMENTS ===

You have access to a web search tool called LuminAIries that can find articles from AI luminaries and researchers. Use this tool ONLY if the context documents do not contain enough information.

When you use the LuminAIries tool, incorporate the findings into your response and provide links to the articles for further reading.

Please base your responses on the context provided above when relevant. If the context doesn't contain information to answer the question, acknowledge this and provide general knowledge while being clear about what information comes from the context vs. your general knowledge.

Keep your answer to less than 20 sentences.`;

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
      tools: {
        LuminAIries: LuminAIriesTool,
      },
      maxTokens: 1500,
    });

    // Extract web search results from tool calls (if any)
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        if (toolCall.toolName === "LuminAIries" && toolCall.args) {
          try {
            const searchResults = await LuminAIriesTool.execute(toolCall.args, {
              toolCallId: toolCall.toolCallId,
              messages,
            });
            webSources = searchResults.map((result) => ({
              id: result.id,
              title: result.title,
              url: result.url,
              snippet: result.snippet,
              author: (result as any).author,
              publishedDate: result.publishedDate,
              source: "web-search" as const
            }));
          } catch (error) {
            console.error("Error executing LuminAIries tool:", error);
          }
        }
      }
    }

    // Always use the parallel web search results at the bottom
    webSources = await webSearchPromise;

    // Return both the text response and sources
    return Response.json({
      role: "assistant",
      content: result.text,
      sources: sources,
      webSources: webSources,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return Response.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
