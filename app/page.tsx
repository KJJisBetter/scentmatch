export default function HomePage() {
  return (
    <main className='min-h-screen bg-gradient-to-br from-purple-50 to-pink-50'>
      <div className='container mx-auto px-4 py-16'>
        <div className='text-center'>
          <h1 className='text-5xl font-bold text-gray-900 mb-4'>
            Welcome to ScentMatch
          </h1>
          <p className='text-xl text-gray-600 mb-8'>
            AI-Powered Fragrance Discovery Platform
          </p>
          <div className='max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8'>
            <h2 className='text-2xl font-semibold mb-4'>
              🚀 Deployment Successful!
            </h2>
            <p className='text-gray-700 mb-6'>
              ScentMatch is now deployed on Vercel with preview environments
              configured.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-left'>
              <div className='p-4 bg-gray-50 rounded'>
                <h3 className='font-semibold text-gray-800'>
                  ✅ Infrastructure
                </h3>
                <ul className='text-sm text-gray-600 mt-2 space-y-1'>
                  <li>• Next.js 15 App Router</li>
                  <li>• Supabase Integration</li>
                  <li>• TailwindCSS 4.0+</li>
                  <li>• TypeScript</li>
                </ul>
              </div>
              <div className='p-4 bg-gray-50 rounded'>
                <h3 className='font-semibold text-gray-800'>✅ Deployment</h3>
                <ul className='text-sm text-gray-600 mt-2 space-y-1'>
                  <li>• Vercel Production</li>
                  <li>• Preview Environments</li>
                  <li>• GitHub CI/CD</li>
                  <li>• Health Monitoring</li>
                </ul>
              </div>
            </div>
            <div className='mt-6 p-4 bg-blue-50 rounded'>
              <p className='text-sm text-blue-800'>
                <strong>Health Check:</strong> Visit{' '}
                <a href='/api/health' className='underline'>
                  /api/health
                </a>{' '}
                to verify system status
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
