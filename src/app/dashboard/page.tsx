import { BaseLayout } from "@/components/layouts/base-layout"
import { SectionCards } from "./components/section-cards"
import { ProblemSet } from "./components/problem-set"

export default function Page() {
  return (
    <BaseLayout title="Coding Dashboard" description="Track your coding progress and solve new problems">
        <div className="@container/main px-4 lg:px-6 space-y-6">
          <SectionCards />
          <ProblemSet />
        </div>
    </BaseLayout>
  )
}
