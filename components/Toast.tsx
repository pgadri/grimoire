'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

export type ToastData = {
  id: string
  message: string
  type: ToastType
}

type Props = {
  toasts: ToastData[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastData; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border shadow-lg ${colors[toast.type]} min-w-64 max-w-sm`}>
      {toast.type === 'success' && <CheckCircle size={18} className="mt-0.5 shrink-0" />}
      {toast.type === 'error' && <XCircle size={18} className="mt-0.5 shrink-0" />}
      {toast.type === 'info' && <CheckCircle size={18} className="mt-0.5 shrink-0" />}
      <p className="text-sm flex-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)}>
        <X size={14} />
      </button>
    </div>
  )
}

// Hook
import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
