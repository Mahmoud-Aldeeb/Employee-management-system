export default function Loading({ fullScreen = true }: { fullScreen?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'h-dvh' : 'py-24'}`}>
      <div
        role="status"
        aria-label="Loading"
        className="size-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"
      />
    </div>
  );
}