export default function LoadingOperativo() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-56 md:h-72 rounded-2xl bg-gray-200" />
      <div className="space-y-3">
        <div className="h-6 w-1/3 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="h-4 w-1/4 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-5/6 bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
      </div>
    </main>
  );
}
