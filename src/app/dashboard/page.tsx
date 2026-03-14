"use client"

import { BaseLayout } from "@/components/layouts/base-layout"
// import { SectionCards } from "./components/section-cards"
import { ProblemSet } from "./components/problem-set"
import { CompactCalendar } from "@/components/compact-calendar"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export default function Page() {
  const { user } = useAuth()

  return (
    <BaseLayout title="Coding Dashboard" description="Track your coding progress and solve new problems">
        <div className="@container/main px-4 lg:px-6 space-y-6">
          {/* <SectionCards /> */}
          
          {/* Calendar and Stats Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {user?.id && (
              <div className="xl:col-span-1">
                <CompactCalendar userId={user.id} />
              </div>
            )}
            <div className={cn("xl:col-span-3", !user?.id && "xl:col-span-3")}>
              {/* Additional stats or quick actions could go here */}
              <ProblemSet />
            </div>
          </div>
        </div>
    </BaseLayout>
  )
}
