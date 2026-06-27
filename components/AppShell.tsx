'use client'

import { BottomNav, SideNav } from './Nav'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#EDE9E3]">
      <SideNav />
      {/* On desktop, offset content to the right of the sidebar */}
      <main className="lg:ml-56 pb-20 lg:pb-8">
        <div className="w-full px-4 lg:px-8">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
