'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

// Minimal test page to verify browse functionality works
export default function TestBrowsePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/search?q=${searchQuery}&limit=10`);
      const data = await response.json();
      setResults(data.fragrances || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Browse Test - No FilterSidebar</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fragrances..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {results.length > 0 ? `${results.length} fragrances found` : 'No results yet'}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((fragrance, index) => (
              <div key={fragrance.fragrance_id || index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold">{fragrance.name}</h3>
                <p className="text-gray-600">{fragrance.brand}</p>
                <p className="text-sm text-gray-500">{fragrance.scent_family}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}