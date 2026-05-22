import Image from 'next/image'

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <Image
        src="/logo.png"
        alt="Simple Things Made Beautiful"
        width={320}
        height={160}
        className="object-contain mb-8"
        priority
      />
      <p className="text-gray-500 text-lg tracking-wide text-center">
        Something beautiful is coming soon.
      </p>
    </div>
  )
}
