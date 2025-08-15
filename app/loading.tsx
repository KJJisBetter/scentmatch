export default function Loading() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='text-center'>
        <div className='relative'>
          <div className='w-16 h-16 bg-purple-200 rounded-full animate-pulse mx-auto mb-4'></div>
          <div className='absolute inset-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
        </div>
        <h2 className='text-xl font-semibold text-slate-700 mb-2'>
          Loading ScentMatch
        </h2>
        <p className='text-slate-500'>
          Preparing your fragrance discovery experience...
        </p>
      </div>
    </div>
  );
}
