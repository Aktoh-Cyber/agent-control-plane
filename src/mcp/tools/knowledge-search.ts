/**
 * Knowledge Search Tool
 * Searches medical knowledge bases for relevant information
 */

import type { KnowledgeSearchQuery, KnowledgeSearchResult, MCPToolResponse } from '../types';

export class KnowledgeSearchTool {
  private readonly knowledgeBases: string[];

  constructor() {
    this.knowledgeBases = [];
  }

  /**
   * Search medical knowledge
   */
  async execute(args: KnowledgeSearchQuery): Promise<MCPToolResponse> {
    try {
      // Perform search
      const results = await this.searchKnowledgeBases(args);

      // Sort by relevance
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply max results limit
      const maxResults = args.maxResults || 10;
      const limitedResults = results.slice(0, maxResults);

      const response = {
        query: args.query,
        filters: args.filters,
        resultsCount: limitedResults.length,
        totalFound: results.length,
        results: limitedResults,
        searchMetadata: {
          sources: this.knowledgeBases,
          timestamp: Date.now(),
          avgRelevance: results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length || 0,
        },
      };

      return {
        content: [
          {
            type: 'json',
            json: response,
          },
          {
            type: 'text',
            text: this.formatSearchResults(response),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Knowledge search failed: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Search knowledge bases.
   * Returns empty results when no knowledge base backends are configured.
   * Configure backends by adding entries to `this.knowledgeBases` and
   * implementing real search integration per source.
   */
  private async searchKnowledgeBases(
    _query: KnowledgeSearchQuery
  ): Promise<KnowledgeSearchResult[]> {
    if (this.knowledgeBases.length === 0) {
      return [];
    }

    // Future: iterate over configured backends and query each one.
    // Each backend should implement its own search interface and return
    // KnowledgeSearchResult objects with real citations.
    return [];
  }

  /**
   * Format search results
   */
  private formatSearchResults(response: any): string {
    let report = '🔍 Medical Knowledge Search Results\n\n';

    report += `📊 Query: "${response.query}"\n`;
    report += `📚 Sources Searched: ${response.searchMetadata.sources.join(', ')}\n`;
    report += `📈 Results: ${response.resultsCount} shown (${response.totalFound} total found)\n`;
    report += `🎯 Average Relevance: ${(response.searchMetadata.avgRelevance * 100).toFixed(1)}%\n`;
    report += `⏰ Searched: ${new Date(response.searchMetadata.timestamp).toISOString()}\n\n`;

    report += `📋 Top Results:\n\n`;

    for (let i = 0; i < response.results.length; i++) {
      const result = response.results[i];

      report += `${i + 1}. ${result.title}\n`;
      report += `   Source: ${result.source}\n`;
      report += `   Relevance: ${(result.relevanceScore * 100).toFixed(1)}%\n`;
      report += `   Last Updated: ${result.lastUpdated.toISOString().split('T')[0]}\n`;
      report += `   Citations: ${result.citations.length}\n`;
      report += `   ${result.content.substring(0, 150)}...\n\n`;
    }

    if (response.totalFound > response.resultsCount) {
      report += `... and ${response.totalFound - response.resultsCount} more results\n`;
    }

    return report;
  }
}
