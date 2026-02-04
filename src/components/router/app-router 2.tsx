"use client"

import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { routes, type RouteConfig } from '@/config/routes'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const FullPageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
)

function renderRoutes(routeConfigs: RouteConfig[]) {
  return routeConfigs.map((route, index) => (
    <Route
      key={route.path + index}
      path={route.path}
      element={
        <Suspense fallback={<FullPageLoader />}>
          {route.element}
        </Suspense>
      }
    >
      {route.children && renderRoutes(route.children)}
    </Route>
  ))
}

export function AppRouter() {
  return (
    <Routes>
      {renderRoutes(routes)}
    </Routes>
  )
}
