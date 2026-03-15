import { Container } from '@/components/layout/Container'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-12 bg-gray-200 rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-gray-200 rounded mb-1" />
          <div className="h-4 w-1/2 bg-gray-100 rounded" />
        </div>
        <div className="text-right flex-shrink-0">
          <div className="h-4 w-16 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-20 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="h-3 w-24 bg-gray-100 rounded" />
      </div>
    </div>
  )
}

export default function HomeLoading() {
  return (
    <Container>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </Container>
  )
}
