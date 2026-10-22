/**
 * DonationFi — Arc Mainnet USDC donation dApp
 * Campaign: Fund the Next Arc Builder
 */

import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { ExternalLink, Zap } from 'lucide-react'
import { DonationStats } from './components/DonationStats'
import { DonatePanel } from './components/DonatePanel'
import { RecentDonations } from './components/RecentDonations'
import { OwnerWithdraw } from './components/OwnerWithdraw'
import { DONATION_FI_ADDRESS } from './contracts/DonationFi'

function contractExplorerUrl() {
  return `https://explorer.arc.io/address/${DONATION_FI_ADDRESS}`
}

export default function App() {
  const { isConnected } = useAccount()
  // Bump this to force RecentDonations to refresh after a donation
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div
      className="min-h-dvh"
      style={{
        background: 'linear-gradient(180deg, #fefce8 0%, #fffbf0 45%, #fef9ec 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: 'rgba(254,252,232,0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(234,179,8,0.20)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex size-8 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#d97706,#fbbf24)' }}
            >
              <Zap className="size-4 text-white" />
            </div>
            <span
              className="font-bold text-lg tracking-tight"
              style={{ color: '#292524', fontFamily: "'Space Grotesk', sans-serif" }}
            >
              DonationFi
            </span>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 pt-8 pb-24 flex flex-col gap-5">
        {/* Campaign header card */}
        <div
          className="rounded-3xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(217,119,6,0.92) 0%, rgba(245,158,11,0.94) 60%, rgba(251,191,36,0.90) 100%)',
            boxShadow: '0 8px 32px rgba(217,119,6,0.25)',
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="text-xs font-semibold tracking-widest uppercase mb-2 opacity-80"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              >
                Arc Hackathon Campaign
              </div>
              <h1
                className="text-2xl font-bold mb-2 text-balance"
                style={{
                  color: '#fff',
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '-0.02em',
                }}
              >
                Fund the Next Arc Builder
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
                Hackathon Demo Campaign
              </p>
            </div>
            {/* Arc logo mark */}
            <div
              className="flex-shrink-0 size-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}
            >
              <Zap className="size-7 text-white" />
            </div>
          </div>

          <p
            className="mt-4 text-sm leading-relaxed text-pretty"
            style={{ color: 'rgba(255,255,255,0.80)' }}
          >
            This is a test campaign created to launch DonationFi and participate in the Arc Hackathon.
            Real campaigns will be added to the platform in the future. Thank you for being part of
            the beginning of DonationFi on Arc!
          </p>

          <div className="mt-4 flex items-center gap-2">
            <a
              href={contractExplorerUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold transition-all hover:opacity-80"
              style={{
                color: 'rgba(255,255,255,0.85)',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '999px',
                padding: '4px 12px',
              }}
            >
              View contract <ExternalLink className="size-3" />
            </a>
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}
            >
              Arc Mainnet
            </span>
          </div>
        </div>

        {/* Stats */}
        <DonationStats />

        {/* Donate */}
        {isConnected ? (
          <DonatePanel onDonated={() => setRefreshKey((k) => k + 1)} />
        ) : (
          <NotConnectedCta />
        )}

        {/* Owner controls */}
        <OwnerWithdraw />

        {/* Recent donations */}
        <RecentDonations refreshKey={refreshKey} />
      </main>
    </div>
  )
}

function NotConnectedCta() {
  return (
    <div
      className="rounded-3xl p-6 flex flex-col items-center gap-4 text-center"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(234,179,8,0.20)',
        boxShadow: '0 2px 24px rgba(18,45,69,0.07)',
      }}
    >
      <div
        className="size-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(234,179,8,0.14)' }}
      >
        <Zap className="size-6" style={{ color: '#b45309' }} />
      </div>
      <div>
        <div className="text-base font-bold mb-1" style={{ color: '#292524' }}>
          Connect to Donate
        </div>
        <div className="text-sm" style={{ color: '#78716c' }}>
          Connect your wallet to Arc Mainnet and donate USDC to support the next Arc builder.
        </div>
      </div>
      <ConnectKitButton label="Connect Wallet" />
    </div>
  )
}
