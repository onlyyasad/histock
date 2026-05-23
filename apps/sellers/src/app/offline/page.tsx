export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-6xl">📵</span>
      <h1 className="text-2xl font-semibold text-gray-900">You're offline</h1>
      <p className="text-gray-500 max-w-xs">
        Check your internet connection and try again. Your data is safe and will sync when you're
        back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium"
      >
        Try again
      </button>
    </div>
  )
}
