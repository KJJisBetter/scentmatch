import { Metadata } from 'next';
import { EnhancedQuizFlow } from '@/components/quiz/enhanced-quiz-flow';

export const metadata: Metadata = {
  title: 'Enhanced Emotional Fragrance Discovery - ScentMatch',
  description:
    'Discover your authentic fragrance personality through emotionally-resonant questions that bypass analytical thinking.',
  keywords:
    'emotional fragrance quiz, authentic personality, scent discovery, emotional associations',
};

export default function EnhancedQuizPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-amber-50/20'>
      <div className='container mx-auto px-4 py-8 max-w-5xl'>
        {/* Enhanced Header */}
        <div className='text-center mb-12'>
          <h1 className='text-5xl font-serif font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent leading-tight'>
            Discover Your Authentic Fragrance Soul
          </h1>
          <p className='text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto'>
            Step beyond traditional fragrance categories. This emotional
            discovery journey reveals your authentic scent identity through the
            language of feelings, memories, and dreams.
          </p>

          <div className='flex items-center justify-center space-x-8 text-sm text-muted-foreground'>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full' />
              <span>5 minutes of self-discovery</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full' />
              <span>Emotional intelligence matching</span>
            </div>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full' />
              <span>Authentic personality insights</span>
            </div>
          </div>
        </div>

        {/* Enhanced Quiz Interface */}
        <EnhancedQuizFlow />

        {/* Enhanced Trust Signals */}
        <div className='mt-16 text-center'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-muted-foreground'>
            <div className='space-y-3'>
              <div className='text-3xl'>🎭</div>
              <h3 className='font-semibold text-foreground text-lg'>
                Authentic Self-Discovery
              </h3>
              <p className='leading-relaxed'>
                No generic categories or robotic classifications. Discover your
                true fragrance identity through emotional resonance and
                authentic self-expression.
              </p>
            </div>
            <div className='space-y-3'>
              <div className='text-3xl'>🌟</div>
              <h3 className='font-semibold text-foreground text-lg'>
                Emotionally Intelligent Matching
              </h3>
              <p className='leading-relaxed'>
                Our questions bypass analytical thinking to capture your
                authentic preferences through feelings, memories, and
                aspirational imagery.
              </p>
            </div>
            <div className='space-y-3'>
              <div className='text-3xl'>💫</div>
              <h3 className='font-semibold text-foreground text-lg'>
                Storytelling Results
              </h3>
              <p className='leading-relaxed'>
                Receive personality insights that read like poetry, not data.
                Understand not just what you like, but why it resonates with
                your soul.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
