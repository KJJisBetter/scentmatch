/**
 * Mock Components for Progressive Loading Tests
 * 
 * Simplified versions of components for testing progressive loading functionality
 */

import React from 'react';

// Mock ProgressiveQuizFlow
export function ProgressiveQuizFlow({ 
  initialGender, 
  onConversionReady 
}: {
  initialGender?: string;
  onConversionReady?: (results: any) => void;
}) {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <div data-testid="quiz-skeleton">Loading quiz...</div>;
  }

  return (
    <div data-testid="quiz-content" className="animate-fade-in">
      <h1>Quiz Content</h1>
      <p>Gender: {initialGender}</p>
    </div>
  );
}

// Mock ProgressiveSearchResults
export function ProgressiveSearchResults({
  query,
  results,
  isLoading,
  error,
  onResultSelect,
  onPerformanceMetric
}: {
  query: string;
  results: any[];
  isLoading: boolean;
  error?: string | null;
  onResultSelect: (result: any) => void;
  onPerformanceMetric?: (metric: { name: string; value: number }) => void;
}) {
  React.useEffect(() => {
    if (!isLoading && results.length > 0 && onPerformanceMetric) {
      onPerformanceMetric({ name: 'first-contentful-paint', value: 500 });
    }
  }, [isLoading, results.length, onPerformanceMetric]);

  if (isLoading) {
    return <div data-testid="search-skeleton">
      <div data-testid="skeleton-header">Loading header...</div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} data-testid="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }}>
          Loading card {i + 1}
        </div>
      ))}
    </div>;
  }

  if (error) {
    return <div data-testid="search-error">{error}</div>;
  }

  return (
    <div data-testid="search-results">
      <div data-testid="results-header">Results for "{query}"</div>
      {results.map((result, index) => (
        <div 
          key={result.id} 
          data-testid="result-card"
          style={{ animationDelay: `${index * 0.1}s` }}
          onClick={() => onResultSelect(result)}
        >
          {result.name}
        </div>
      ))}
    </div>
  );
}

// Mock ProgressiveCollectionPreview
export function ProgressiveCollectionPreview({
  recommendations,
  quiz_session_token,
  onSaveCollection,
  onSkip,
  isLoading
}: {
  recommendations: any[];
  quiz_session_token: string;
  onSaveCollection: (data: any) => void;
  onSkip: () => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div data-testid="collection-skeleton">
        <div data-testid="skeleton-stats-card">Loading stats...</div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} data-testid="collection-item" style={{ animationDelay: `${i * 0.15}s` }}>
            Loading item {i + 1}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="collection-preview">
      <h1>Collection Preview</h1>
      {recommendations.map((rec, index) => (
        <div 
          key={rec.fragrance.id} 
          data-testid="collection-item"
          style={{ animationDelay: `${index * 0.15}s` }}
        >
          {rec.fragrance.name}
        </div>
      ))}
      <button onClick={() => onSaveCollection({ 
        quiz_session_token, 
        fragrance_ids: recommendations.map(r => r.fragrance.id) 
      })}>
        Save Collection
      </button>
      <button onClick={onSkip}>Skip</button>
    </div>
  );
}