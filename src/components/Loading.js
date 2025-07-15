export default function Loading({
  message = "Loading...",
  size = "md",
  className = "",
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center">
        <div
          className={`inline-block animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}
        ></div>
        <p className="mt-2 text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

// Skeleton loader for table rows
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-300 rounded w-8"></div>
            <div className="h-4 bg-gray-300 rounded w-64"></div>
            <div className="h-4 bg-gray-300 rounded w-96"></div>
            <div className="h-4 bg-gray-300 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Card skeleton loader
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
      <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        <div className="h-4 bg-gray-300 rounded w-4/6"></div>
      </div>
    </div>
  );
}
