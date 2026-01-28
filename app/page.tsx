export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-responsive-xl font-bold text-jungle-600 mb-4 animate-fade-in">
          Costa Rica Wedding
        </h1>
        <p className="text-responsive-base text-sage-700 animate-slide-up">
          Pura Vida! Welcome to our destination wedding platform.
        </p>
        
        {/* Mobile-friendly navigation buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/guest/dashboard"
            className="btn-primary-mobile text-center"
            aria-label="Guest Portal"
          >
            🌴 Guest Portal
          </a>
          <a
            href="/admin"
            className="btn-secondary-mobile text-center"
            aria-label="Admin Dashboard"
          >
            ⚙️ Admin Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
