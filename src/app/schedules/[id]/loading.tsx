import { Container } from '@/components/layout/Container'

export default function ScheduleDetailLoading() {
  return (
    <Container>
      <div className="mb-6 flex items-center gap-3 animate-pulse">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="h-8 w-28 bg-gray-200 rounded" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
        <div className="mb-4">
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="h-7 w-2/3 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-full bg-gray-100 rounded mb-1" />
        <div className="h-4 w-3/4 bg-gray-100 rounded mb-6" />
        <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
          <div className="flex-1 h-10 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </Container>
  )
}
