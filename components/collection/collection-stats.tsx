import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Star, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Sparkles
} from 'lucide-react';

interface CollectionStatsProps {
  stats: {
    total_items: number;
    families_explored: number;
    completion_rate: number;
    average_rating: number;
    total_rated: number;
    most_recent: string | null;
  };
}

/**
 * Collection Stats Component - Task 2.1 (Phase 1B)
 * 
 * Displays key collection statistics in an attractive card layout.
 * Shows real-time metrics about user's collection health and progress.
 */
export function CollectionStats({ stats }: CollectionStatsProps) {
  const {
    total_items,
    families_explored,
    completion_rate,
    average_rating,
    total_rated,
    most_recent,
  } = stats;

  // Format recent date
  const formatRecentDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Get completion status color
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Get rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <>
      {/* Total Collection Size */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-gray-600">
            <Heart className="w-4 h-4 mr-2 text-purple-600" />
            Total Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-purple-600">
              {total_items}
            </div>
            <div className="text-sm text-gray-500">
              {total_items === 1 ? 'fragrance' : 'fragrances'}
            </div>
          </div>
          {total_items > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Last added: {formatRecentDate(most_recent)}
            </p>
          )}
        </CardContent>
        
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-bl-full opacity-50" />
      </Card>

      {/* Scent Families Explored */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-gray-600">
            <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
            Scent Families
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              {families_explored}
            </div>
            <div className="text-sm text-gray-500">explored</div>
          </div>
          <div className="mt-2">
            {families_explored < 3 ? (
              <Badge variant="outline" className="text-xs">
                Beginner Explorer
              </Badge>
            ) : families_explored < 6 ? (
              <Badge variant="secondary" className="text-xs">
                Active Explorer
              </Badge>
            ) : (
              <Badge variant="default" className="text-xs">
                Expert Explorer
              </Badge>
            )}
          </div>
        </CardContent>
        
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-bl-full opacity-50" />
      </Card>

      {/* Collection Completion Rate */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-gray-600">
            <BarChart3 className="w-4 h-4 mr-2 text-green-600" />
            Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <div className={`text-2xl font-bold ${getRatingColor(completion_rate / 20)}`}>
              {completion_rate}%
            </div>
            <div className="text-sm text-gray-500">complete</div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completion_rate}%` }}
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            {total_items - Math.round((completion_rate / 100) * total_items)} items need attention
          </p>
        </CardContent>
        
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-bl-full opacity-50" />
      </Card>

      {/* Average Rating */}
      <Card className="relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-sm font-medium text-gray-600">
            <Star className="w-4 h-4 mr-2 text-yellow-600" />
            Average Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            {total_rated > 0 ? (
              <>
                <div className={`text-2xl font-bold ${getRatingColor(average_rating)}`}>
                  {average_rating.toFixed(1)}
                </div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= Math.round(average_rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-gray-400">—</div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            {total_rated > 0 
              ? `Based on ${total_rated} ${total_rated === 1 ? 'rating' : 'ratings'}`
              : 'No ratings yet'
            }
          </p>
          
          {total_rated === 0 && total_items > 0 && (
            <Badge variant="outline" className="text-xs mt-2">
              Rate your fragrances!
            </Badge>
          )}
        </CardContent>
        
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-bl-full opacity-50" />
      </Card>
    </>
  );
}