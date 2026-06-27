'use client'

import { useState } from 'react'
import { GitBranch, Zap, Check, ChevronRight, Shield, Rocket, Calendar, Map, Layers, ShoppingBag, Users, User } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { ScanResult } from '@/lib/types'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-amber-100 text-amber-700 border-amber-200',
  medium: 'bg-purple-100 text-[#7C5CBF] border-purple-200',
}

const TESTING_TIERS = [
  {
    id: 'starter',
    emoji: '🧪',
    name: 'Starter',
    headline: 'Bug reports + UX feedback',
    testers: '5 testers',
    turnaround: '48h turnaround',
    price: 299,
    features: ['5 real testers', '48h turnaround', 'Bug report PDF', 'UX feedback'],
  },
  {
    id: 'growth',
    emoji: '🚀',
    name: 'Growth',
    headline: 'Detailed reports + video recordings',
    testers: '15 testers',
    turnaround: '24h turnaround',
    price: 699,
    features: ['15 real testers', '24h turnaround', 'Detailed bug reports', 'UX + accessibility', 'Video recordings'],
  },
  {
    id: 'enterprise',
    emoji: '💼',
    name: 'Enterprise',
    headline: 'Priority queue + dedicated manager',
    testers: '50 testers',
    turnaround: '12h turnaround',
    price: 1499,
    features: ['50 real testers', '12h turnaround', 'Priority queue', 'All devices', 'Dedicated manager', 'NDA available'],
  },
]

type TestingTier = typeof TESTING_TIERS[0]

function TierCard({ tier, selected, onPress }: { tier: TestingTier; selected: boolean; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className={`w-full rounded-2xl border p-4 text-left transition-all mb-2 ${
        selected ? 'border-[#2A1B5E] bg-[#2A1B5E]/5' : 'border-[#E8E4DE] bg-[#EDE9E3]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl w-7 text-center">{tier.emoji}</span>
        <div className="flex-1">
          <p className={`text-sm font-bold ${selected ? 'text-[#2A1B5E]' : 'text-[#1A2332]'}`}>{tier.name}</p>
          <p className="text-xs text-[#8B8B8B] mt-0.5">{tier.headline} · {tier.testers} · {tier.turnaround}</p>
        </div>
        <p className={`text-base font-extrabold shrink-0 ${selected ? 'text-[#2A1B5E]' : 'text-[#8B8B8B]'}`}>${tier.price}</p>
      </div>
      {selected && (
        <div className="mt-3 pl-10 space-y-1">
          {tier.features.map((f, i) => (
            <p key={i} className="text-xs text-[#1A2332]">✓  {f}</p>
          ))}
        </div>
      )}
    </button>
  )
}

export default function ServicesPage() {
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [repoUrl, setRepoUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [appName, setAppName] = useState('')
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [campaigns, setCampaigns] = useState<{ id: string; appName: string; tier: string; status: string }[]>([])

  async function handleScan() {
    if (!repoUrl.trim()) return
    setScanning(true)
    setScanResult(null)
    try {
      const result = await api.repo.scan(repoUrl.trim())
      setScanResult(result)
      addToast('Scan complete!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Scan failed', 'error')
    } finally {
      setScanning(false)
    }
  }

  async function handleRequestCampaign() {
    if (!selectedTier || !appName.trim() || !contactEmail.includes('@')) {
      addToast('Fill in all fields', 'error')
      return
    }
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setCampaigns(prev => [...prev, {
      id: crypto.randomUUID(), appName: appName.trim(),
      tier: selectedTier, status: 'pending',
    }])
    const tier = TESTING_TIERS.find(t => t.id === selectedTier)!
    setSubmitting(false)
    setSubmitted(true)
    setSelectedTier(null)
    addToast(`Campaign requested! We'll reach out to ${contactEmail} within ${tier.turnaround}.`, 'success')
  }

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="px-4 pt-5 pb-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[26px] font-extrabold text-[#1A2332]">Expert Help</h1>
          <p className="text-xs text-[#8B8B8B] mt-0.5">Tools that help you ship with confidence</p>
        </div>

        {/* Plan badge */}
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-3 shadow-sm border border-[#E8E4DE]">
          <div className="w-2 h-2 rounded-full bg-[#F0A500]" />
          <p className="flex-1 text-sm font-semibold text-[#1A2332]">Free plan · 20 captures / 10 threads</p>
          <button className="text-sm font-bold text-[#2A1B5E]">Upgrade ↗</button>
        </div>

        {/* ─── Repo Monitoring ─── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B]">REPO MONITORING</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A1B5E]/10 flex items-center justify-center shrink-0">
                <GitBranch size={20} className="text-[#2A1B5E]" />
              </div>
              <div>
                <p className="font-bold text-[#1A2332] text-sm">Automated Repo Scans</p>
                <p className="text-xs text-[#8B8B8B] mt-0.5 leading-relaxed">
                  Upgrade to Solopreneur to get weekly automated scans and push alerts.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                placeholder="https://github.com/you/your-repo"
                className="flex-1 px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20"
                onKeyDown={e => e.key === 'Enter' && handleScan()}
              />
              <button
                onClick={handleScan}
                disabled={scanning || !repoUrl.trim()}
                className="px-4 py-2.5 bg-[#2A1B5E] text-white rounded-xl text-sm font-bold hover:bg-[#3D2878] transition-colors disabled:opacity-60 shrink-0 flex items-center gap-2"
              >
                {scanning ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Scan'}
              </button>
            </div>

            {scanResult && (
              <div className="space-y-3 pt-4 border-t border-[#E8E4DE]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#1A2332]">{scanResult.owner}/{scanResult.repo}</p>
                    {scanResult.detectedStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scanResult.detectedStack.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 bg-[#EDE9E3] text-[#7C5CBF] rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${scanResult.score >= 70 ? 'text-[#22C55E]' : scanResult.score >= 40 ? 'text-[#F0A500]' : 'text-[#EF4444]'}`}>
                      {scanResult.score}
                    </p>
                    <p className="text-[10px] text-[#8B8B8B]">score</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {scanResult.findings.slice(0, 3).map(f => (
                    <div key={f.id} className="bg-[#EDE9E3] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${SEVERITY_STYLES[f.severity] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {f.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-[#1A2332] flex-1">{f.title}</span>
                      </div>
                      <p className="text-xs text-[#8B8B8B]">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => repoUrl.trim() ? handleScan() : addToast('Enter a repo URL first', 'info')}
              className="w-full flex items-center justify-center gap-2 border border-[#2A1B5E] text-[#2A1B5E] font-bold rounded-full py-3 text-sm hover:bg-[#2A1B5E]/5 transition-colors"
            >
              <Rocket size={15} /> View full readiness report
            </button>
          </div>
        </section>

        {/* ─── App Testing ─── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B]">APP TESTING</p>
            <span className="text-[9px] font-bold text-[#7C5CBF] bg-[#7C5CBF]/15 px-2 py-0.5 rounded-full">BETA</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F0A500]/15 flex items-center justify-center shrink-0">
                <span className="text-xl">📱</span>
              </div>
              <div>
                <p className="font-bold text-[#1A2332] text-sm">Real Device Testers</p>
                <p className="text-xs text-[#8B8B8B] mt-0.5 leading-relaxed">
                  Real users. Real devices. Structured feedback, bug reports, and a "ready to ship" verdict.
                </p>
              </div>
            </div>

            {TESTING_TIERS.map(tier => (
              <TierCard
                key={tier.id}
                tier={tier}
                selected={selectedTier === tier.id}
                onPress={() => setSelectedTier(selectedTier === tier.id ? null : tier.id)}
              />
            ))}

            {selectedTier && !submitted && (
              <div className="space-y-3 pt-2 border-t border-[#E8E4DE]">
                <p className="text-sm font-bold text-[#1A2332]">
                  Request {TESTING_TIERS.find(t => t.id === selectedTier)!.name} campaign
                </p>
                <input
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  placeholder="App name"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none"
                />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none"
                />
                <button
                  onClick={handleRequestCampaign}
                  disabled={submitting || !appName.trim() || !contactEmail.includes('@')}
                  className="w-full bg-[#2A1B5E] text-white font-bold py-3 rounded-xl hover:bg-[#3D2878] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Requesting…</>
                    : `Request for $${TESTING_TIERS.find(t => t.id === selectedTier)!.price}`}
                </button>
                <p className="text-[11px] text-[#BDBDBD] text-center">We'll reach out to confirm before charging anything.</p>
              </div>
            )}

            {submitted && (
              <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check size={20} className="text-white" />
                </div>
                <p className="font-bold text-[#1A2332] text-sm">Campaign Requested!</p>
                <p className="text-xs text-[#8B8B8B] mt-1">We'll reach out within 48h to get started.</p>
              </div>
            )}
          </div>

          {campaigns.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4 mt-3 space-y-2">
              <p className="text-[10px] font-bold tracking-wider text-[#8B8B8B]">MY CAMPAIGNS</p>
              {campaigns.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1A2332]">{c.appName}</p>
                    <p className="text-xs text-[#8B8B8B]">{TESTING_TIERS.find(t => t.id === c.tier)?.name} · {TESTING_TIERS.find(t => t.id === c.tier)?.testers}</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#F0A500] bg-[#F0A500]/15 px-2 py-1 rounded-full">PENDING</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Security ─── */}
        <section>
          <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mb-3">SECURITY</p>
          <button
            onClick={() => addToast('Security audit booking coming soon!', 'info')}
            className="w-full bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F0A500]/15 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-[#F0A500]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-[#1A2332] text-sm">Human Security Audit</p>
              <p className="text-xs text-[#8B8B8B] mt-0.5">Get your codebase reviewed by a vetted security engineer before launch.</p>
            </div>
            <ChevronRight size={18} className="text-[#2A1B5E] shrink-0" />
          </button>
        </section>

        {/* ─── Launch Prep ─── */}
        <section>
          <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mb-3">LAUNCH PREP</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/readiness'}
              className="w-full bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2A1B5E]/10 flex items-center justify-center shrink-0">
                <Rocket size={20} className="text-[#2A1B5E]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-[#1A2332] text-sm">Launch Readiness Report</p>
                <p className="text-xs text-[#8B8B8B] mt-0.5">Full risk breakdown with AI-powered fix prompts for each issue.</p>
              </div>
              <ChevronRight size={18} className="text-[#2A1B5E] shrink-0" />
            </button>
            <button
              onClick={() => addToast('Launch Runway coming soon!', 'info')}
              className="w-full bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-xl bg-[#2A1B5E]/10 flex items-center justify-center shrink-0">
                <Calendar size={20} className="text-[#2A1B5E]" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-[#1A2332] text-sm">Launch Runway</p>
                <p className="text-xs text-[#8B8B8B] mt-0.5">Set your launch date, track phases, get milestone reminders.</p>
              </div>
              <ChevronRight size={18} className="text-[#2A1B5E] shrink-0" />
            </button>
          </div>
        </section>

        {/* ─── Coming Soon ─── */}
        <section>
          <p className="text-[11px] font-bold tracking-wider text-[#8B8B8B] mb-3">COMING SOON</p>
          <div className="space-y-2">
            {[
              { icon: <Map size={20} />, color: '#7C6AF7', title: 'Learning Maps', desc: 'Organize captures into shareable learning paths for your stack.' },
              { icon: <Layers size={20} />, color: '#10B981', title: 'Knowledge Packets', desc: 'Bundle your best captures and sell them to other vibe coders.' },
              { icon: <ShoppingBag size={20} />, color: '#F59E0B', title: 'Marketplace', desc: 'Browse and buy curated knowledge packs from other builders.' },
              { icon: <Users size={20} />, color: '#EF4444', title: 'Team Workspace', desc: 'Collaborate on captures and track progress with co-founders.' },
              { icon: <User size={20} />, color: '#2A1B5E', title: 'Creator Profile', desc: 'Build a public profile and grow your audience as a builder.' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-[#E8E4DE] p-4 flex items-center gap-3 opacity-75">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.color + '18' }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#1A2332] text-sm">{item.title}</p>
                  <p className="text-xs text-[#8B8B8B] mt-0.5">{item.desc}</p>
                </div>
                <span className="text-[9px] font-bold text-[#8B8B8B] bg-[#E8E4DE] px-2 py-1 rounded-full shrink-0">SOON</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
