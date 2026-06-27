'use client'

import { useState } from 'react'
import { GitBranch, Zap, Check, ChevronRight, Star } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { ToastContainer, useToast } from '@/components/Toast'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import type { ScanResult } from '@/lib/types'

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-amber-100 text-amber-700 border-amber-200',
  medium: 'bg-purple-100 text-[#7C5CBF] border-purple-200',
}

const TESTING_TIERS = [
  {
    id: 'starter',
    name: 'Starter Testing',
    tagline: '5 testers, 48h turnaround',
    price: 299,
    features: ['5 real testers', '48h turnaround', 'Bug report PDF', 'UX feedback'],
  },
  {
    id: 'growth',
    name: 'Growth Testing',
    tagline: '15 testers, 24h turnaround',
    price: 699,
    features: ['15 real testers', '24h turnaround', 'Detailed bug reports', 'UX + accessibility', 'Video recordings'],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Testing',
    tagline: '50 testers, 12h turnaround',
    price: 1499,
    features: ['50 real testers', '12h turnaround', 'Priority queue', 'All devices', 'Dedicated manager', 'NDA available'],
  },
]

export default function ServicesPage() {
  const { user } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  // Repo scanning state
  const [repoUrl, setRepoUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)

  // Testing campaign state
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [appName, setAppName] = useState('')
  const [contactEmail, setContactEmail] = useState(user?.email || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
    if (!selectedTier || !appName.trim() || !contactEmail.trim()) {
      addToast('Please fill in all fields', 'error')
      return
    }
    setSubmitting(true)
    // Simulate request — no real API
    await new Promise(resolve => setTimeout(resolve, 1200))
    setSubmitting(false)
    setSubmitted(true)
    addToast('Campaign request received! We will be in touch within 24h.', 'success')
  }

  return (
    <AppShell>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="sticky top-0 bg-[#EDE9E3]/95 backdrop-blur-sm pt-6 pb-3 px-4 z-10">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1A2332]">Expert Help</h1>
            <p className="text-xs text-[#8B8B8B]">Tools that help you ship with confidence</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-[#2A1B5E]/10 text-[#2A1B5E] px-2.5 py-1 rounded-full font-medium">
              Free plan
            </span>
            <p className="text-[10px] text-[#8B8B8B] mt-0.5">20 captures · 10 threads</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-5">
        {/* Repo Monitoring section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">REPO MONITORING</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE] shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-[#2A1B5E]/10 rounded-xl flex items-center justify-center shrink-0">
                <GitBranch size={20} className="text-[#2A1B5E]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1A2332]">Automated Repo Scans</h2>
                <p className="text-xs text-[#8B8B8B] mt-0.5">
                  Weekly security and launch-readiness scans. Catch exposed keys, missing auth, open CORS, and more before they hurt you.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
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
                className="px-4 py-2.5 bg-[#2A1B5E] text-white rounded-xl text-sm font-semibold hover:bg-[#3D2878] transition-colors disabled:opacity-60 shrink-0 flex items-center gap-2"
              >
                {scanning ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Scan'}
              </button>
            </div>

            {scanResult && (
              <div className="space-y-3 mt-4 pt-4 border-t border-[#E8E4DE]">
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
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${SEVERITY_STYLES[f.severity]}`}>
                          {f.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-[#1A2332] flex-1">{f.title}</span>
                      </div>
                      <p className="text-xs text-[#8B8B8B]">{f.description}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="/readiness"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#EDE9E3] text-[#2A1B5E] font-semibold rounded-xl text-sm hover:bg-[#2A1B5E] hover:text-white transition-colors"
                >
                  View Full Readiness Report
                  <ChevronRight size={16} />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* App Testing section */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold text-[#8B8B8B] uppercase tracking-wider">APP TESTING</p>
            <span className="text-[10px] px-2 py-0.5 bg-[#F0A500] text-white rounded-full font-semibold">Beta</span>
          </div>
          <p className="text-xs text-[#8B8B8B] mb-3">Get real humans to test your app before launch.</p>

          {/* Tier cards */}
          <div className="space-y-3 mb-4">
            {TESTING_TIERS.map(tier => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative ${
                  selectedTier === tier.id
                    ? 'border-[#2A1B5E] bg-[#2A1B5E]/5'
                    : tier.highlighted
                    ? 'border-[#7C5CBF] bg-white'
                    : 'border-[#E8E4DE] bg-white'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-2.5 left-4 text-[10px] px-2.5 py-0.5 bg-[#7C5CBF] text-white rounded-full font-semibold">
                    Most Popular
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${selectedTier === tier.id ? 'text-[#2A1B5E]' : 'text-[#1A2332]'}`}>
                      {tier.name}
                    </p>
                    <p className="text-xs text-[#8B8B8B] mt-0.5">{tier.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tier.features.map(f => (
                        <span key={f} className="flex items-center gap-1 text-[10px] text-[#8B8B8B]">
                          <Check size={10} className="text-[#22C55E]" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-lg font-bold text-[#1A2332]">${tier.price}</p>
                    <p className="text-[10px] text-[#8B8B8B]">one-time</p>
                  </div>
                </div>
                {selectedTier === tier.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2A1B5E] flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Campaign form */}
          {submitted ? (
            <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={24} className="text-white" />
              </div>
              <p className="font-semibold text-[#1A2332] mb-1">Campaign Request Sent!</p>
              <p className="text-sm text-[#8B8B8B]">
                We&apos;ll reach out to {contactEmail} within 24 hours to get started.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-[#E8E4DE]">
              <h3 className="font-semibold text-[#1A2332] text-sm mb-3">Request a Campaign</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#8B8B8B] mb-1">App Name</label>
                  <input
                    value={appName}
                    onChange={e => setAppName(e.target.value)}
                    placeholder="My Awesome App"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8B8B8B] mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-sm text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none"
                  />
                </div>
                {!selectedTier && (
                  <p className="text-xs text-[#8B8B8B] text-center">Select a testing tier above</p>
                )}
                <button
                  onClick={handleRequestCampaign}
                  disabled={submitting || !selectedTier || !appName.trim() || !contactEmail.trim()}
                  className="w-full bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl hover:bg-[#3D2878] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                  ) : (
                    <><Zap size={16} /> Request Campaign</>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
