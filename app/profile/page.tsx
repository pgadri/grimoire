'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Check, X, ChevronRight, GitBranch, ShieldAlert, CreditCard, FileText, HelpCircle, LogOut, Trash2, Star, BookOpen } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { storageCaptures, storageAuth } from '@/lib/storage'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, updateUser, isLoading } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHandle, setEditHandle] = useState('')
  const [captureCount, setCaptureCount] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/signin')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    setCaptureCount(storageCaptures.getAll().length)
  }, [])

  useEffect(() => {
    if (user) {
      setEditName(user.name || '')
      setEditBio(user.bio || '')
      setEditHandle(user.handle || '')
      setGithubUrl(user.githubUsername ? `https://github.com/${user.githubUsername}` : '')
    }
  }, [user])

  function startEdit() {
    setEditName(user?.name || '')
    setEditBio(user?.bio || '')
    setEditHandle(user?.handle || '')
    setEditing(true)
  }

  function saveEdit() {
    updateUser({
      name: editName.trim() || user?.name,
      bio: editBio.trim() || undefined,
      handle: editHandle.trim() || undefined,
    })
    setEditing(false)
    addToast('Profile updated', 'success')
  }

  function handleSignOut() {
    signOut()
    router.replace('/signin')
  }

  function handleDeleteAccount() {
    setShowDeleteConfirm(false)
    addToast('Account deletion requested. This feature is coming soon.', 'info')
  }

  function saveGithub() {
    const username = githubUrl.replace('https://github.com/', '').replace(/\/$/, '')
    updateUser({ githubUsername: username || undefined })
    setShowGithubModal(false)
    addToast('GitHub repo saved', 'success')
  }

  if (isLoading || !user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  const initial = user.name?.[0]?.toUpperCase() || '?'

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="px-4 pt-8 pb-8 space-y-5">
        {/* Profile header */}
        <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE] shadow-sm">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[#2A1B5E] flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
                  />
                  <input
                    value={editHandle}
                    onChange={e => setEditHandle(e.target.value)}
                    placeholder="@handle"
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
                  />
                  <textarea
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    placeholder="Short bio"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2A1B5E] text-white rounded-xl text-sm font-medium hover:bg-[#3D2878] transition-colors"
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#E8E4DE] text-[#8B8B8B] rounded-xl text-sm font-medium hover:bg-[#EDE9E3] transition-colors"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h1 className="font-bold text-[#1A2332] text-lg leading-tight">{user.name}</h1>
                    <button
                      onClick={startEdit}
                      className="p-1.5 rounded-lg hover:bg-[#EDE9E3] transition-colors"
                    >
                      <Edit2 size={15} className="text-[#8B8B8B]" />
                    </button>
                  </div>
                  <p className="text-sm text-[#8B8B8B]">
                    {user.handle ? `@${user.handle}` : <span className="italic">Set a handle</span>}
                  </p>
                  {user.bio && (
                    <p className="text-xs text-[#1A2332] mt-1.5 leading-relaxed">{user.bio}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          {!editing && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-[#E8E4DE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EDE9E3] flex items-center justify-center">
                  <BookOpen size={14} className="text-[#7C5CBF]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A2332]">{captureCount}</p>
                  <p className="text-[10px] text-[#8B8B8B]">Captures</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#EDE9E3] flex items-center justify-center">
                  <Star size={14} className="text-[#F0A500]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1A2332]">0</p>
                  <p className="text-[10px] text-[#8B8B8B]">Starred</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workspace section */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E4DE]">
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">Workspace</p>
          </div>
          <WorkspaceRow
            icon={<ShieldAlert size={16} className="text-[#7C5CBF]" />}
            label="Repo Scanner"
            sublabel="Scan your GitHub repo for risks"
            onPress={() => router.push('/readiness')}
          />
          <WorkspaceRow
            icon={<GitBranch size={16} className="text-[#1A2332]" />}
            label="GitHub Repo"
            sublabel={user.githubUsername ? `github.com/${user.githubUsername}` : 'Link your repository'}
            onPress={() => setShowGithubModal(true)}
            last
          />
        </div>

        {/* Account section */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E8E4DE]">
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">Account</p>
          </div>
          <WorkspaceRow
            icon={<CreditCard size={16} className="text-[#F0A500]" />}
            label="Subscription"
            sublabel="Free plan · Upgrade"
            onPress={() => addToast('Upgrade coming soon!', 'info')}
          />
          <WorkspaceRow
            icon={<FileText size={16} className="text-[#8B8B8B]" />}
            label="Privacy Policy"
            onPress={() => addToast('Coming soon', 'info')}
          />
          <WorkspaceRow
            icon={<FileText size={16} className="text-[#8B8B8B]" />}
            label="Terms of Service"
            onPress={() => addToast('Coming soon', 'info')}
          />
          <WorkspaceRow
            icon={<HelpCircle size={16} className="text-[#8B8B8B]" />}
            label="Help & Feedback"
            sublabel="pgadri@u.rochester.edu"
            onPress={() => { window.location.href = 'mailto:pgadri@u.rochester.edu' }}
          />
          <div className="border-t border-[#E8E4DE]">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} className="text-[#EF4444]" />
              <span className="text-sm font-medium text-[#EF4444]">Sign Out</span>
            </button>
          </div>
          <div className="border-t border-[#E8E4DE]">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} className="text-[#8B8B8B]" />
              <span className="text-sm font-medium text-[#8B8B8B]">Delete Account</span>
            </button>
          </div>
        </div>

        {/* App version */}
        <p className="text-center text-xs text-[#BDBDBD]">Vibecoded v1.0 · Built with ✦</p>
      </div>

      {/* GitHub modal */}
      <Modal open={showGithubModal} onClose={() => setShowGithubModal(false)} title="Link GitHub Repo">
        <div className="space-y-3">
          <input
            type="url"
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
            placeholder="https://github.com/you/your-repo"
            className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none text-sm"
          />
          <button
            onClick={saveGithub}
            className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl hover:bg-[#3D2878] transition-colors text-sm"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account">
        <div className="space-y-4">
          <p className="text-sm text-[#1A2332]">
            Are you sure you want to delete your account? This action cannot be undone. All your captures and data will be permanently removed.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-3 rounded-xl border border-[#E8E4DE] text-[#8B8B8B] font-semibold text-sm hover:bg-[#EDE9E3] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}

function WorkspaceRow({
  icon,
  label,
  sublabel,
  onPress,
  last = false,
}: {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onPress: () => void
  last?: boolean
}) {
  return (
    <button
      onClick={onPress}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#EDE9E3] transition-colors text-left ${
        !last ? 'border-b border-[#E8E4DE]' : ''
      }`}
    >
      <div className="w-8 h-8 rounded-xl bg-[#EDE9E3] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A2332]">{label}</p>
        {sublabel && <p className="text-xs text-[#8B8B8B] truncate">{sublabel}</p>}
      </div>
      <ChevronRight size={16} className="text-[#8B8B8B] shrink-0" />
    </button>
  )
}
