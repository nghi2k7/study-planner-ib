import { Loader2 } from "lucide-react";

export default function Loading({
  fullScreen = false,
  message = "Loading...",
}) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <Loader2
      className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
}

export function LoadingOverlay({ message = "Processing..." }) {
  return (
    <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-40 rounded-lg">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
