export default function Spinner({ label = "Loading" }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      <p className="mt-4 text-sm text-gray-600">{label}…</p>
    </div>
  )
}
