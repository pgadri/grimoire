'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Check } from 'lucide-react'
import { storageOnboarding } from '@/lib/storage'
import type { OnboardingData } from '@/lib/types'

const STAGES = ['idea', 'building', 'pre-launch', 'live'] as const
const STAGE_LABELS: Record<string, string> = {
  idea: 'Just an idea',
  building: 'Building it',
  'pre-launch': 'Pre-launch',
  live: 'Already live',
}

const STACK_OPTIONS = [
  'Next.js', 'React', 'Expo', 'React Native', 'FastAPI', 'Node.js',
  'Supabase', 'Firebase', 'Stripe', 'OpenAI', 'PostgreSQL', 'Auth.js',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    projectName: '',
    stage: 'building',
    stack: [],
    handlesPayments: false,
    storesUserData: true,
    githubRepo: '',
    completed: false,
  })

  function toggleStack(tag: string) {
    setData(d => ({
      ...d,
      stack: d.stack?.includes(tag) ? d.stack.filter(s => s !== tag) : [...(d.stack || []), tag],
    }))
  }

  function finish() {
    const completed = { ...data, completed: true }
    storageOnboarding.set(completed)
    router.replace('/feed')
  }

  const steps = [
    // Step 0: Project name
    <div key="0" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A2332]">What are you building?</h2>
        <p className="text-[#8B8B8B] mt-1">Give your project a name</p>
      </div>
      <input
        type="text"
        value={data.projectName}
        onChange={e => setData(d => ({ ...d, projectName: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E] text-lg"
        placeholder="My awesome app"
        autoFocus
      />
    </div>,

    // Step 1: Stage
    <div key="1" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A2332]">What stage are you at?</h2>
        <p className="text-[#8B8B8B] mt-1">This helps us surface the right risks</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {STAGES.map(s => (
          <button
            key={s}
            onClick={() => setData(d => ({ ...d, stage: s }))}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              data.stage === s
                ? 'border-[#2A1B5E] bg-[#2A1B5E]/5'
                : 'border-[#E8E4DE] bg-white hover:border-[#7C5CBF]/40'
            }`}
          >
            <div className={`text-sm font-semibold ${data.stage === s ? 'text-[#2A1B5E]' : 'text-[#1A2332]'}`}>
              {STAGE_LABELS[s]}
            </div>
          </button>
        ))}
      </div>
    </div>,

    // Step 2: Stack
    <div key="2" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A2332]">What&apos;s your stack?</h2>
        <p className="text-[#8B8B8B] mt-1">Select all that apply</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STACK_OPTIONS.map(tag => {
          const selected = data.stack?.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleStack(tag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selected
                  ? 'bg-[#2A1B5E] text-white border-[#2A1B5E]'
                  : 'bg-white text-[#1A2332] border-[#E8E4DE] hover:border-[#7C5CBF]/40'
              }`}
            >
              {selected && <Check size={12} className="inline mr-1" />}
              {tag}
            </button>
          )
        })}
      </div>
    </div>,

    // Step 3: Payments + user data
    <div key="3" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A2332]">A couple quick questions</h2>
        <p className="text-[#8B8B8B] mt-1">These shape which risks we scan for</p>
      </div>
      <div className="space-y-3">
        {[
          { key: 'handlesPayments', label: 'Does your app handle payments?', sub: 'Stripe, in-app purchases, etc.' },
          { key: 'storesUserData', label: 'Does your app store user data?', sub: 'Accounts, emails, personal info' },
        ].map(({ key, label, sub }) => {
          const val = data[key as keyof OnboardingData] as boolean
          return (
            <button
              key={key}
              onClick={() => setData(d => ({ ...d, [key]: !val }))}
              className={`w-full p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all ${
                val ? 'border-[#2A1B5E] bg-[#2A1B5E]/5' : 'border-[#E8E4DE] bg-white hover:border-[#7C5CBF]/40'
              }`}
            >
              <div>
                <div className={`font-semibold text-sm ${val ? 'text-[#2A1B5E]' : 'text-[#1A2332]'}`}>{label}</div>
                <div className="text-xs text-[#8B8B8B] mt-0.5">{sub}</div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${val ? 'bg-[#2A1B5E] border-[#2A1B5E]' : 'border-[#E8E4DE]'}`}>
                {val && <Check size={12} className="text-white" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>,

    // Step 4: GitHub repo
    <div key="4" className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A2332]">Link your GitHub repo</h2>
        <p className="text-[#8B8B8B] mt-1">Optional — lets us scan for real vulnerabilities</p>
      </div>
      <input
        type="url"
        value={data.githubRepo}
        onChange={e => setData(d => ({ ...d, githubRepo: e.target.value }))}
        className="w-full px-4 py-3 rounded-xl border border-[#E8E4DE] bg-[#EDE9E3] text-[#1A2332] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2A1B5E]/20 focus:border-[#2A1B5E]"
        placeholder="https://github.com/you/yourrepo"
      />
      <div className="bg-white rounded-xl p-4 border border-[#E8E4DE]">
        <div className="text-sm font-semibold text-[#1A2332] mb-2">What you&apos;ll get:</div>
        <ul className="space-y-1.5">
          {[
            'Real stack detection from your package.json',
            'Specific vulnerabilities from your code',
            'AI prompts to fix each issue',
          ].map(item => (
            <li key={item} className="flex items-center gap-2 text-sm text-[#8B8B8B]">
              <div className="w-1.5 h-1.5 bg-[#7C5CBF] rounded-full" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>,
  ]

  const isLast = step === steps.length - 1

  return (
    <div className="min-h-screen bg-[#EDE9E3] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${i <= step ? 'bg-[#2A1B5E]' : 'bg-[#E8E4DE]'}`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {steps[step]}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl border border-[#E8E4DE] text-[#8B8B8B] font-semibold hover:bg-[#EDE9E3] transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(s => s + 1)}
              className="flex-1 bg-[#2A1B5E] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#3D2878] transition-colors"
            >
              {isLast ? 'Start capturing' : 'Continue'}
              <ChevronRight size={18} />
            </button>
          </div>

          {step < steps.length - 1 && (
            <button
              onClick={finish}
              className="w-full mt-2 text-sm text-[#8B8B8B] hover:text-[#1A2332] py-2 transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
