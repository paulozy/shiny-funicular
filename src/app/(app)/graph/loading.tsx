import { PageSkeleton } from '@/components/ui/PageSkeleton'

// Graph rendering is dominated by the React Flow canvas — we use the
// split variant to suggest a sidebar (filters) + main canvas area.
export default function GraphLoading() {
  return <PageSkeleton variant="split" />
}
