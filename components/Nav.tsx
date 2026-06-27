'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, ShieldAlert, User, Wrench } from 'lucide-react'

const tabs = [
  { href: '/feed',      label: 'Feed',      icon: Home },
  { href: '/discover',  label: 'Discover',  icon: Compass },
  { href: '/readiness', label: 'Readiness', icon: ShieldAlert },
  { href: '/profile',   label: 'Profile',   icon: User },
  { href: '/services',  label: 'Services',  icon: Wrench },
]

/** Mobile-only fixed bottom bar */
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E4DE] z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-0 flex-1 ${
                active ? 'text-[#2A1B5E]' : 'text-[#8B8B8B]'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium truncate ${active ? 'text-[#2A1B5E]' : 'text-[#8B8B8B]'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

/** Desktop-only left sidebar */
export function SideNav() {
  const pathname = usePathname()
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-[#E8E4DE] z-50 py-6 px-3">
      {/* Logo */}
      <div className="px-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#2A1B5E] rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">✦</span>
          </div>
          <span className="font-bold text-[#2A1B5E] text-base tracking-tight">
            vibe<span className="text-[#7C5CBF]">coded</span>
          </span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                active
                  ? 'bg-[#2A1B5E]/8 text-[#2A1B5E]'
                  : 'text-[#8B8B8B] hover:bg-[#EDE9E3] hover:text-[#1A2332]'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 mt-4">
        <p className="text-[10px] text-[#BDBDBD] font-medium tracking-wide uppercase">Vibecoded · Beta</p>
      </div>
    </aside>
  )
}
