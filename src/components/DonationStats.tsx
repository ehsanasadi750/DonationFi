/**
 * DonationStats — hero card showing total raised, count, and progress bar.
 */

import { useReadContract } from 'wagmi'
import { Target, Users, TrendingUp } from 'lucide-react'
import { DONATION_FI_ADDRESS, DONATION_FI_ABI } from '../contracts/DonationFi'
import { ARC_MAINNET_ID, formatUsdc, goalProgress, CAMPAIGN_GOAL_USDC } from '../utils/donationFi'

export function DonationStats() {
  const { data: totalDonated, isLoading: loadingTotal } = useReadContract({
    address: DONATION_FI_ADDRESS,
    abi: DONATION_FI_ABI,
    functionName: 'totalDonated',
    chainId: ARC_MAINNET_ID,
  })

  const { data: donationCount, isLoading: loadingCount } = useReadContract({
    address: DONATION_FI_ADDRESS,
    abi: DONATION_FI_ABI,
    functionName: 'donationCount',
    chainId: ARC_MAINNET_ID,
  })

  const progress = goalProgress(totalDonated)
  const pctLabel = (progress * 100).toFixed(1)

  return (
    <div
      className="rounded-3xl p-5 mb-4"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(18,45,69,0.10)',
        boxShadow: '0 2px 24px rgba(18,45,69,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex size-7 items-center justify-center rounded-xl"
          style={{ background: 'rgba(234,179,8,0.14)' }}
        >
          <TrendingUp className="size-4" style={{ color: '#b45309' }} />
        </div>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#78716c' }}>
          Campaign Progress
        </span>
      </div>

      {/* Big number */}
      <div className="flex items-baseline gap-2 mb-1">
        <span
          className="display text-4xl font-bold tabular-nums"
          style={{ color: 'var(--ink)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}
        >
          {loadingTotal ? '—' : formatUsdc(totalDonated)}
        </span>
        <span className="text-lg font-medium" style={{ color: '#78716c' }}>USDC</span>
      </div>
      <p className="text-xs mb-4" style={{ color: '#a8a29e' }}>
        raised toward {CAMPAIGN_GOAL_USDC.toLocaleString()} USDC goal
      </p>

      {/* Progress bar */}
      <div className="rounded-full h-2.5 mb-1 overflow-hidden" style={{ background: 'rgba(18,45,69,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${(progress * 100).toFixed(1)}%`,
            background: 'linear-gradient(90deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%)',
          }}
        />
      </div>
      <div className="flex justify-between text-xs mb-5" style={{ color: '#a8a29e' }}>
        <span>{pctLabel}% funded</span>
        <span>{CAMPAIGN_GOAL_USDC.toLocaleString()} USDC goal</span>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3">
        <StatChip
          icon={<Users className="size-3.5" />}
          label="Donations"
          value={loadingCount ? '—' : String(donationCount ?? 0n)}
        />
        <StatChip
          icon={<Target className="size-3.5" />}
          label="Goal"
          value={`${CAMPAIGN_GOAL_USDC.toLocaleString()} USDC`}
        />
      </div>
    </div>
  )
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-2.5"
      style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.20)' }}
    >
      <span style={{ color: '#b45309' }}>{icon}</span>
      <div>
        <div className="text-xs" style={{ color: '#78716c' }}>{label}</div>
        <div className="text-sm font-bold tabular-nums" style={{ color: '#292524' }}>{value}</div>
      </div>
    </div>
  )
}
