import { Sparkles, Star } from 'lucide-react';

// Demo page to show AI fragrance descriptions and battle points working
export default function AIDemoPage() {
  // Sample fragrance data for demo
  const sampleFragrances = [
    {
      id: '1',
      name: 'Aventus',
      brand: 'Creed', 
      scent_family: 'fruity',
    },
    {
      id: '2', 
      name: 'Chanel No. 5',
      brand: 'Chanel',
      scent_family: 'floral',
    },
    {
      id: '3',
      name: 'Dior Homme Intense',
      brand: 'Dior',
      scent_family: 'iris',
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">AI Fragrance Enhancement Demo</h1>
          <p className="text-lg text-muted-foreground">
            Demonstrating AI descriptions and battle points system
          </p>
        </div>

        <div className="space-y-12">
          {sampleFragrances.map((fragrance) => (
            <div key={fragrance.id} className="border border-border rounded-lg p-6 bg-card">
              <div className="grid lg:grid-cols-2 gap-8">
                
                {/* AI Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      {fragrance.scent_family}
                    </div>
                    <h2 className="text-xl font-bold">{fragrance.name}</h2>
                    <span className="text-lg text-muted-foreground">by {fragrance.brand}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-plum-600" />
                      <h3 className="text-lg font-semibold text-plum-600">AI Fragrance Analysis</h3>
                    </div>
                    
                    <div className="prose prose-stone max-w-none">
                      <div className="text-base leading-relaxed space-y-3">
                        {generateAIDescription(fragrance)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Battle Points */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Performance Battle Points</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {generateBattlePoints(fragrance).map(({ name, score, icon }) => (
                      <div key={name} className="text-center p-3 border border-border rounded-lg">
                        <div className="text-xl mb-1">{icon}</div>
                        <div className="text-xl font-bold text-foreground">{score}/10</div>
                        <div className="text-xs text-muted-foreground">{name}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        YT
                      </div>
                      <span className="font-medium text-sm">YouTuber Review Framework</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ready for video embeds, reviewer profiles, and rating aggregation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// AI Description Generator (working version)
function generateAIDescription(fragrance: any) {
  const scentFamily = fragrance.scent_family || '';
  const name = fragrance.name;
  const brand = fragrance.brand;
  
  if (scentFamily.includes('iris')) {
    return (
      <div>
        <p>
          <strong>{name} by {brand}</strong> is a sophisticated and refined composition that embodies understated luxury and timeless elegance. 
          This fragrance appeals to those who appreciate subtle complexity and aren't drawn to fleeting trends.
        </p>
        <p>
          With its distinguished iris character, it creates an aura of quiet confidence and intellectual sophistication. 
          Perfect for individuals who value depth, authenticity, and want a signature scent that reflects their refined taste.
        </p>
      </div>
    );
  }
  
  if (scentFamily.includes('floral')) {
    return (
      <div>
        <p>
          <strong>{name} by {brand}</strong> is an elegant floral composition that embodies grace and sophisticated femininity. 
          This fragrance speaks to those who appreciate timeless beauty and aren't afraid to express their romantic side.
        </p>
        <p>
          With its refined floral character, this scent creates an enchanting aura that's both approachable and memorable. 
          Perfect for someone who values authenticity and wants to project confidence with classic elegance.
        </p>
      </div>
    );
  }

  if (scentFamily.includes('fruity')) {
    return (
      <div>
        <p>
          <strong>{name} by {brand}</strong> is a bold and charismatic fragrance that exudes confidence and success. 
          This composition speaks to leaders and achievers who aren't afraid to stand out from the crowd.
        </p>
        <p>
          With its dynamic fruity opening and sophisticated dry down, it creates a powerful presence that commands respect. 
          Perfect for ambitious individuals who want a signature scent that matches their drive and determination.
        </p>
      </div>
    );
  }
  
  // Default
  return (
    <div>
      <p>
        <strong>{name} by {brand}</strong> is a distinctive fragrance that offers a unique olfactory experience. 
        This composition speaks to those who appreciate quality craftsmanship and timeless appeal.
      </p>
      <p>
        Its balanced character creates a sophisticated presence that's versatile for various occasions. 
        Perfect for fragrance enthusiasts who want reliable excellence in their signature scent.
      </p>
    </div>
  );
}

// Battle Points Generator (working version)  
function generateBattlePoints(fragrance: any) {
  const scentFamily = fragrance.scent_family || '';
  
  if (scentFamily.includes('iris')) {
    return [
      { name: 'Projection', score: 7, icon: '📡' },
      { name: 'Longevity', score: 8, icon: '⏰' }, 
      { name: 'Uniqueness', score: 9, icon: '💎' },
      { name: 'Versatility', score: 8, icon: '🎯' },
      { name: 'Value', score: 7, icon: '💰' },
    ];
  }
  
  if (scentFamily.includes('floral')) {
    return [
      { name: 'Projection', score: 6, icon: '📡' },
      { name: 'Longevity', score: 7, icon: '⏰' }, 
      { name: 'Uniqueness', score: 7, icon: '💎' },
      { name: 'Versatility', score: 9, icon: '🎯' },
      { name: 'Value', score: 8, icon: '💰' },
    ];
  }

  if (scentFamily.includes('fruity')) {
    return [
      { name: 'Projection', score: 9, icon: '📡' },
      { name: 'Longevity', score: 8, icon: '⏰' }, 
      { name: 'Uniqueness', score: 8, icon: '💎' },
      { name: 'Versatility', score: 7, icon: '🎯' },
      { name: 'Value', score: 6, icon: '💰' },
    ];
  }
  
  // Default battle points
  return [
    { name: 'Projection', score: 6, icon: '📡' },
    { name: 'Longevity', score: 7, icon: '⏰' }, 
    { name: 'Uniqueness', score: 6, icon: '💎' },
    { name: 'Versatility', score: 7, icon: '🎯' },
    { name: 'Value', score: 8, icon: '💰' },
  ];
}