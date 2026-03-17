"use client"

import { BaseLayout } from "@/components/layouts/base-layout"
import { DataTable } from "./components/data-table"

export default function UsersPage() {
  return (
    <BaseLayout title="Users" description="Discover coders and connect with friends">
      <div className="@container/main px-4 lg:px-6 mt-4">
        <DataTable />
      </div>
    </BaseLayout>
  )
}
