import type { WebSearchSource } from "@/types/chat";

interface WebSourcesDisplayProps {
  webSources: WebSearchSource[];
}

export default function WebSourcesDisplay({ webSources }: WebSourcesDisplayProps) {
  if (!webSources.length) return null;

  return (
    <div className="w-full max-w-md lg:max-w-2xl mt-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-600 dark:text-blue-400">🌐</span>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
            LuminAIries: Web Articles from AI Luminaries
          </h3>
        </div>
        
        <div className="space-y-3">
          {webSources.map((source) => (
            <div key={source.id} className="group">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                      {source.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {source.snippet}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {source.author && (
                        <span className="flex items-center gap-1">
                          <span>👤</span>
                          {source.author}
                        </span>
                      )}
                      {source.publishedDate && (
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          {new Date(source.publishedDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">
                      Read →
                    </span>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            These articles are curated by LuminAIries, your AI luminary web search assistant.
          </p>
        </div>
      </div>
    </div>
  );
} 