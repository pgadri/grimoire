'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/feed')
      } else {
        router.replace('/signin')
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-[#EDE9E3] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
