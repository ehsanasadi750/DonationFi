/**
 * RecentDonations — reads Donation events from the chain and displays them.
 */

import { useEffect, useState, useCallback } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { arcMainnet } from '../config'
import { ExternalLink, Clock } from 'lucide-react'
import { DONATION_FI_ADDRESS } from '../contracts/DonationFi'
import { formatUsdc, shortAddr, txUrl } from '../utils/donationFi'

interface DonationEvent {
  donor: string
  amount: bigint
  txHash: string
  blockNumber: bigint
}

const DONATION_EVENT_ABI = parseAbiItem(
  'event Donation(address indexed donor, uint256 amount)',
)

const client = createPublicClient({
  chain: arcMainnet,
  transport: http('https://rpc.mainnet.arc.io'),
})

const MAX_EVENTS = 10
const LOOKBACK_BLOCKS = 5000n

export function RecentDonations({ refreshKey }: { refreshKey: number }) {
  const [events, setEvents] = useState<DonationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // Expose a manual refresh that avoids calling setState inside the effect directly
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const latest = await client.getBlockNumber()
        const fromBlock = latest > LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS : 0n

        const logs = await client.getLogs({
          address: DONATION_FI_ADDRESS,
          event: DONATION_EVENT_ABI,
          fromBlock,
          toBlock: 'latest',
        })

        const parsed: DonationEvent[] = logs
          .slice(-MAX_EVENTS)
          .reverse()
          .map((log) => ({
            donor: log.args.donor ?? '',
            amount: log.args.amount ?? 0n,
            txHash: log.transactionHash ?? '',
            blockNumber: log.blockNumber ?? 0n,
          }))
          .filter((e) => e.donor !== '')

        if (!cancelled) setEvents(parsed)
      } catch (_fetchError) {
        if (!cancelled) setError('Could not load donation history. Check your connection.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [tick, refreshKey])

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(18,45,69,0.10)',
        boxShadow: '0 2px 24px rgba(18,45,69,0.07)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex size-7 items-center justify-center rounded-xl"
          style={{ background: 'rgba(234,179,8,0.14)' }}
        >
          <Clock className="size-4" style={{ color: '#b45309' }} />
        </div>
        <span className="text-sm font-bold" style={{ color: '#292524' }}>Recent Donations</span>
        {!loading && (
          <button
            onClick={refresh}
            className="ml-auto text-xs font-semibold transition-all hover:opacity-70"
            style={{ color: '#b45309' }}
          >
            Refresh
          </button>
        )}
      </div>

      {loading && (
        <div className="py-6 text-center text-xs" style={{ color: '#a8a29e' }}>
          Loading donation history…
        </div>
      )}

      {error && !loading && (
        <div
          className="rounded-2xl p-3 text-sm text-center"
          style={{ background: 'rgba(186,43,76,0.07)', color: '#ba2b4c' }}
        >
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="py-6 text-center text-xs" style={{ color: '#a8a29e' }}>
          No donations yet — be the first to contribute!
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="flex flex-col gap-2">
          {events.map((ev, i) => (
            <div
              key={`${ev.txHash}-${i}`}
              className="flex items-center justify-between rounded-2xl px-4 py-3 transition-all hover:scale-[1.005]"
              style={{
                background: 'rgba(234,179,8,0.06)',
                border: '1px solid rgba(234,179,8,0.18)',
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-mono" style={{ color: '#78716c' }}>
                  {shortAddr(ev.donor)}
                </span>
                <span className="text-xs" style={{ color: '#a8a29e' }}>
                  Block #{ev.blockNumber.toString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: '#b45309', fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  +{formatUsdc(ev.amount)} USDC
                </span>
                {ev.txHash && (
                  <a
                    href={txUrl(ev.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-all hover:opacity-70"
                    title="View on Arc Explorer"
                  >
                    <ExternalLink className="size-3.5" style={{ color: '#a8a29e' }} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
