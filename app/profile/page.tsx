'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight, ShieldAlert, GitBranch, CreditCard, FileText,
  HelpCircle, LogOut, Trash2, Scan, Zap, Users, Bell, Lock,
} from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { storageCaptures } from '@/lib/storage'
import type { Capture } from '@/lib/types'

const LEVELS = [
  { name: 'Newcomer', emoji: '🌱', min: 0, color: '#8B8B8B' },
  { name: 'Builder', emoji: '🔨', min: 50, color: '#2A6EBB' },
  { name: 'Maker', emoji: '⚡', min: 150, color: '#7C5CBF' },
  { name: 'Expert', emoji: '🎯', min: 300, color: '#2A9E6B' },
  { name: 'Visionary', emoji: '🚀', min: 500, color: '#F0A500' },
  { name: 'Legend', emoji: '✦', min: 1000, color: '#2A1B5E' },
]

function getLevelForPoints(pts: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

function getNextLevel(pts: number) {
  const current = getLevelForPoints(pts)
  const idx = LEVELS.indexOf(current)
  return LEVELS[idx + 1] ?? null
}

function progressToNext(pts: number) {
  const current = getLevelForPoints(pts)
  const next = getNextLevel(pts)
  if (!next) return 1
  return (pts - current.min) / (next.min - current.min)
}

function calcStreak(captures: Capture[]): number {
  if (!captures.length) return 0
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (captures.some(c => c.date === label)) streak++
    else if (i > 0) break
  }
  return streak
}

type SettingItem = {
  icon: React.ReactNode
  iconBg: string
  label: string
  sub: string
  route?: string
  onPress?: () => void
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, updateUser, isLoading } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHandle, setEditHandle] = useState('')
  const [captures, setCaptures] = useState<Capture[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showGithubModal, setShowGithubModal] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')
  const [notifReplies, setNotifReplies] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) router.replace('/signin')
  }, [user, isLoading, router])

  useEffect(() => {
    setCaptures(storageCaptures.getAll())
    const notif = localStorage.getItem('grimoire:notif_thread_replies')
    setNotifReplies(notif !== 'false')
  }, [])

  useEffect(() => {
    if (user) {
      setEditName(user.name || '')
      setEditBio(user.bio || '')
      setEditHandle(user.handle || '')
      setGithubUrl(user.githubUsername ? `https://github.com/${user.githubUsername}` : '')
    }
  }, [user])

  function saveEdit() {
    updateUser({ name: editName.trim() || user?.name, bio: editBio.trim() || undefined, handle: editHandle.trim() || undefined })
    setEditing(false)
    addToast('Profile updated', 'success')
  }

  function handleSignOut() {
    signOut()
    router.replace('/signin')
  }

  function handleDeleteAccount() {
    setShowDeleteConfirm(false)
    addToast('Account deletion requested. Contact hello@vibecoded.tech', 'info')
  }

  function saveGithub() {
    const username = githubUrl.replace('https://github.com/', '').replace(/\/$/, '')
    updateUser({ githubUsername: username || undefined })
    setShowGithubModal(false)
    addToast('GitHub repo saved', 'success')
  }

  if (isLoading || !user) {
    return <AppShell><div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-[#2A1B5E] border-t-transparent rounded-full animate-spin" /></div></AppShell>
  }

  const displayName = user.name || 'Vibe Coder'
  const displayHandle = user.handle ? `@${user.handle}` : '@you'
  const initial = displayName[0]?.toUpperCase() || 'V'
  const bio = user.bio || 'Building something great.'

  const starred = captures.filter(c => c.starred).length
  const streak = calcStreak(captures)
  const repPoints = 0
  const level = getLevelForPoints(repPoints)
  const next = getNextLevel(repPoints)
  const progress = progressToNext(repPoints)

  const WORKSPACE_ITEMS: SettingItem[] = [
    { icon: <Scan size={17} className="text-white" />, iconBg: '#34C759', label: 'Repo Scanner', sub: 'Scan any public GitHub repo for risks', route: '/readiness' },
    { icon: <ShieldAlert size={17} className="text-white" />, iconBg: '#5856D6', label: 'Expert Review', sub: 'Get your code audited before launch', route: '/services' },
    { icon: <Users size={17} className="text-white" />, iconBg: '#007AFF', label: 'Team Workspace', sub: 'Collaborate with your team', onPress: () => addToast('Coming soon!', 'info') },
    { icon: <Zap size={17} className="text-white" />, iconBg: '#FF9500', label: 'Connectors', sub: 'GitHub, OpenAI, Notion', onPress: () => addToast('Coming soon!', 'info') },
    { icon: <GitBranch size={17} className="text-white" />, iconBg: '#FF6B35', label: 'GitHub Repo', sub: user.githubUsername ? `github.com/${user.githubUsername}` : 'Link your repository', onPress: () => setShowGithubModal(true) },
  ]

  const ACCOUNT_ITEMS: SettingItem[] = [
    { icon: <Lock size={17} className="text-white" />, iconBg: '#8E8E93', label: 'Privacy & Visibility', sub: 'Who can see your captures', onPress: () => addToast('Coming soon!', 'info') },
    { icon: <CreditCard size={17} className="text-white" />, iconBg: '#FF9F0A', label: 'Subscription', sub: 'Free plan · Upgrade', onPress: () => addToast('Upgrade coming soon!', 'info') },
    { icon: <FileText size={17} className="text-white" />, iconBg: '#5856D6', label: 'Privacy Policy', sub: 'How we handle your data', onPress: () => addToast('Coming soon', 'info') },
    { icon: <FileText size={17} className="text-white" />, iconBg: '#007AFF', label: 'Terms of Service', sub: 'Rules of use', onPress: () => addToast('Coming soon', 'info') },
    { icon: <HelpCircle size={17} className="text-white" />, iconBg: '#34C759', label: 'Help & Feedback', sub: 'hello@vibecoded.tech', onPress: () => { window.location.href = 'mailto:hello@vibecoded.tech' } },
    { icon: <Trash2 size={17} className="text-white" />, iconBg: '#FF3B30', label: 'Delete Account', sub: 'Permanently remove your data', onPress: () => setShowDeleteConfirm(true) },
  ]

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="w-9 h-9 bg-[#2A1B5E] rounded-full flex items-center justify-center">
          <span className="text-white text-base font-bold">✦</span>
        </div>
        <h1 className="text-base font-bold text-[#1A2332]">Profile</h1>
        <div className="w-9" />
      </div>

      <div className="px-4 pb-12 space-y-4">
        {/* Identity */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 bg-[#2A1B5E] rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-md overflow-hidden">
            {user.avatarUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              : initial}
          </div>
          <h2 className="text-[22px] font-bold text-[#1A2332]">{displayName}</h2>
          <button
            onClick={() => { navigator.clipboard.writeText(displayHandle); addToast('Copied!', 'success') }}
            className="flex items-center gap-1.5 text-sm text-[#7C5CBF] font-semibold mt-1 mb-3"
          >
            {displayHandle}
            <span className="text-xs">⎘</span>
          </button>
          <div className="bg-[#2A1B5E]/10 rounded-full px-4 py-1.5 mb-3">
            <span className="text-[10px] font-bold text-[#2A1B5E] tracking-wider">FREE · UPGRADE ↗</span>
          </div>
          <p className="text-sm text-[#8B8B8B] text-center">{bio}</p>
        </div>

        {/* Edit Profile button */}
        {!editing ? (
          <button
            onClick={() => { setEditing(true); setEditName(user.name || ''); setEditBio(user.bio || ''); setEditHandle(user.handle || '') }}
            className="w-full border border-[#2A1B5E] rounded-full py-2.5 text-sm font-bold text-[#2A1B5E] hover:bg-[#2A1B5E]/5 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="space-y-2 bg-white rounded-2xl border border-[#E8E4DE] p-4">
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name"
              className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20" />
            <input value={editHandle} onChange={e => setEditHandle(e.target.value)} placeholder="@handle"
              className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20" />
            <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Short bio" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 resize-none" />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-[#2A1B5E] text-white rounded-xl text-sm font-bold hover:bg-[#3D2878] transition-colors">Save</button>
              <button onClick={() => setEditing(false)} className="flex-1 py-2.5 border border-[#E8E4DE] text-[#8B8B8B] rounded-xl text-sm font-medium hover:bg-[#EDE9E3] transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Stats card */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4 flex divide-x divide-[#E8E4DE]">
          {[
            { label: 'Captures', value: captures.length.toString() },
            { label: 'Starred', value: starred.toString() },
            { label: 'Repos', value: '0' },
            { label: 'Streak', value: `${streak}d` },
          ].map(s => (
            <div key={s.label} className="flex-1 flex flex-col items-center py-1">
              <span className="text-xl font-bold text-[#1A2332]">{s.value}</span>
              <span className="text-[11px] text-[#8B8B8B] mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Reputation card */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{level.emoji}</span>
              <div>
                <p className="font-extrabold text-lg" style={{ color: level.color }}>{level.name}</p>
                <p className="text-[11px] text-[#8B8B8B]">{repPoints} sparks ✦</p>
              </div>
            </div>
          </div>
          {next && (
            <>
              <div className="h-1.5 bg-[#E8E4DE] rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress * 100}%`, backgroundColor: level.color }}
                />
              </div>
              <p className="text-[11px] text-[#8B8B8B]">{next.min - repPoints} sparks to {next.emoji} {next.name}</p>
            </>
          )}
        </div>

        {/* Creator locked */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-3 flex items-center gap-3">
          <span className="text-[#BDBDBD]">🔒</span>
          <p className="text-sm text-[#BDBDBD] flex-1">Reach Expert level (300 sparks) to unlock Creator Mode</p>
        </div>

        {/* Streak card */}
        <div className="bg-[#2A1B5E] rounded-2xl p-4 flex items-center gap-4 shadow-md">
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Capture streak</p>
            <p className="text-[11px] text-white/70 mt-0.5 mb-3">
              {streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} in a row. Keep it up.` : 'Capture something today to start your streak.'}
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < streak ? 'bg-[#F0A500]' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl">{streak > 0 ? '🔥' : '💤'}</span>
            <span className="text-2xl font-extrabold text-white">{streak}</span>
          </div>
        </div>

        {/* My public repos placeholder */}
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mb-3">MY PUBLIC REPOS</p>
          <div className="bg-white rounded-2xl border border-[#E8E4DE] p-4 shadow-sm">
            <p className="text-xs text-[#8B8B8B]">No public repos yet. Connect a repo in Workspace settings.</p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E8E4DE] my-2" />

        {/* Notifications */}
        <div>
          <p className="text-xs font-bold text-[#8B8B8B] uppercase tracking-wider mb-2 ml-1">NOTIFICATIONS</p>
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FF3B30' }}>
                <Bell size={17} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#1A2332]">Thread replies</p>
                <p className="text-xs text-[#8B8B8B] mt-0.5">Push notification when someone replies</p>
              </div>
              <button
                onClick={() => {
                  const next = !notifReplies
                  setNotifReplies(next)
                  localStorage.setItem('grimoire:notif_thread_replies', next ? 'true' : 'false')
                }}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${notifReplies ? 'bg-[#2A1B5E]' : 'bg-[#E8E4DE]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifReplies ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Workspace settings */}
        <div>
          <p className="text-xs font-bold text-[#8B8B8B] uppercase tracking-wider mb-2 ml-1">WORKSPACE</p>
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
            {WORKSPACE_ITEMS.map((item, i) => (
              <button
                key={item.label}
                onClick={() => item.route ? router.push(item.route) : item.onPress?.()}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#EDE9E3] transition-colors text-left ${i < WORKSPACE_ITEMS.length - 1 ? 'border-b border-[#E8E4DE]' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.iconBg }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2332]">{item.label}</p>
                  <p className="text-xs text-[#8B8B8B] truncate">{item.sub}</p>
                </div>
                <ChevronRight size={15} className="text-[#BDBDBD] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Account settings */}
        <div>
          <p className="text-xs font-bold text-[#8B8B8B] uppercase tracking-wider mb-2 ml-1">ACCOUNT</p>
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
            {ACCOUNT_ITEMS.map((item, i) => (
              <button
                key={item.label}
                onClick={item.onPress}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#EDE9E3] transition-colors text-left ${i < ACCOUNT_ITEMS.length - 1 ? 'border-b border-[#E8E4DE]' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.iconBg }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A2332]">{item.label}</p>
                  <p className="text-xs text-[#8B8B8B] truncate">{item.sub}</p>
                </div>
                <ChevronRight size={15} className="text-[#BDBDBD] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[#E8E4DE] rounded-2xl py-4 shadow-sm text-[#EF4444] font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} />
          Sign Out
        </button>

        <p className="text-center text-xs text-[#BDBDBD]">Vibecoded · Beta · Built with ✦</p>
      </div>

      {/* GitHub modal */}
      <Modal open={showGithubModal} onClose={() => setShowGithubModal(false)} title="Link GitHub Repo">
        <div className="space-y-3">
          <input type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/you/your-repo"
            className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none text-sm" />
          <button onClick={saveGithub} className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl hover:bg-[#3D2878] transition-colors text-sm">Save</button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Account?">
        <div className="space-y-4">
          <p className="text-sm text-[#1A2332]">
            This permanently removes your profile, handle, and account data. Your public posts stay anonymised. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl border border-[#E8E4DE] text-[#8B8B8B] font-semibold text-sm hover:bg-[#EDE9E3] transition-colors">Cancel</button>
            <button onClick={handleDeleteAccount} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors">Delete</button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
