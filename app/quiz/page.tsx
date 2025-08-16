import { Metadata } from 'next';
import { QuizInterface } from '@/components/quiz/quiz-interface';

/**
 * Fragrance Personality Quiz Page (MVP)
 * 
 * Simple but effective quiz that determines user's fragrance personality
 * and provides immediate recommendations for sample ordering
 */

export const metadata: Metadata = {
  title: 'Discover Your Fragrance Personality - ScentMatch',
  description: 'Take our 3-minute quiz to discover your fragrance personality and get personalized scent recommendations.',
  keywords: 'fragrance quiz, personality test, scent matching, perfume finder, fragrance recommendations',
  openGraph: {
    title: 'Find Your Perfect Fragrance in 3 Minutes',
    description: 'Discover your fragrance personality and get personalized recommendations tailored just for you.',
    type: 'website',
    images: [
      {
        url: '/og-quiz.jpg',
        width: 1200,
        height: 630,
        alt: 'ScentMatch Fragrance Personality Quiz',
      }
    ],
  },
};

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Quiz Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            Discover Your Fragrance Personality
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Answer a few questions to find fragrances perfectly matched to your style
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>3 minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full" />
              <span>No account required</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span>Instant results</span>
            </div>
          </div>
        </div>

        {/* Main Quiz Interface */}
        <QuizInterface />
        
        {/* Trust Signals */}
        <div className="mt-12 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-medium text-foreground mb-1">Personalized Matching</h3>
              <p>Our quiz analyzes your style to find fragrances you'll actually love</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🧪</div>
              <h3 className="font-medium text-foreground mb-1">Try Before You Buy</h3>
              <p>Order samples of your matches to test them risk-free</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-medium text-foreground mb-1">Privacy First</h3>
              <p>No account required. Your data is automatically deleted after 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}