'use client';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-cloud-100">
      <div className="text-center max-w-md mx-auto">
        <div className="text-6xl mb-6 animate-pulse-gentle">📡</div>
        <h1 className="text-responsive-lg font-bold text-sage-900 mb-4">
          You're Offline
        </h1>
        <p className="text-responsive-base text-sage-600 mb-6">
          It looks like you've lost your internet connection. Some features may not be available.
        </p>
        
        <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-sage-900 mb-3">
            Available Offline:
          </h2>
          <ul className="text-left space-y-2 text-sage-700">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>View your cached itinerary</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Browse previously loaded events</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>View accommodation details</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Access cached photos</span>
            </li>
          </ul>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="btn-primary-mobile w-full"
        >
          🔄 Try Again
        </button>
        
        <p className="text-sm text-sage-500 mt-4">
          Pura Vida! We'll sync your changes when you're back online.
        </p>
      </div>
    </main>
  );
}
