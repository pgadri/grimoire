'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const maxW = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto shadow-2xl`}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-[#E8E4DE]">
            <h2 className="text-lg font-semibold text-[#1A2332]">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#EDE9E3] transition-colors">
              <X size={20} className="text-[#8B8B8B]" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[#EDE9E3] transition-colors z-10"
          >
            <X size={20} className="text-[#8B8B8B]" />
          </button>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
