export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-volcano-50 to-cloud-100">
      <div className="w-full max-w-md">
        <div className="card-mobile text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-volcano-600 mb-4">
            Access Denied
          </h1>
          <p className="text-sage-700 mb-6">
            You don't have permission to access this page. This area is restricted to wedding hosts and administrators.
          </p>
          <div className="space-y-3">
            <a
              href="/guest/dashboard"
              className="btn-primary-mobile w-full block"
            >
              Go to Guest Portal
            </a>
            <a
              href="/"
              className="btn-secondary-mobile w-full block"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
