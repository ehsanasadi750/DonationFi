/**
 * OwnerWithdraw — visible only to the contract owner; withdraws all USDC.
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Loader2, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { DONATION_FI_ADDRESS, DONATION_FI_ABI } from '../contracts/DonationFi'
import { ARC_MAINNET_ID, formatUsdc, txUrl, parseError } from '../utils/donationFi'

export function OwnerWithdraw() {
  const { address } = useAccount()

  // Is this wallet the owner?
  const { data: owner } = useReadContract({
    address: DONATION_FI_ADDRESS,
    abi: DONATION_FI_ABI,
    functionName: 'owner',
    chainId: ARC_MAINNET_ID,
  })

  const isOwner =
    address != null &&
    owner != null &&
    address.toLowerCase() === owner.toLowerCase()

  // Contract balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: DONATION_FI_ADDRESS,
    abi: DONATION_FI_ABI,
    functionName: 'contractBalance',
    chainId: ARC_MAINNET_ID,
  })

  const {
    writeContract,
    data: hash,
    isPending: walletPending,
    reset,
  } = useWriteContract()

  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!hash },
  })

  if (isSuccess) void refetchBalance()

  if (!isOwner) return null

  function handleWithdraw() {
    writeContract(
      {
        address: DONATION_FI_ADDRESS,
        abi: DONATION_FI_ABI,
        functionName: 'withdraw',
        chainId: ARC_MAINNET_ID,
      },
      {
        onError(err) {
          toast.error(parseError(err))
        },
      },
    )
  }

  const isPending = walletPending || confirming
  const isEmpty = balance != null && balance === 0n

  return (
    <div
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(234,179,8,0.30)',
        boxShadow: '0 2px 24px rgba(234,179,8,0.10)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex size-7 items-center justify-center rounded-xl"
          style={{ background: 'rgba(234,179,8,0.14)' }}
        >
          <ShieldCheck className="size-4" style={{ color: '#b45309' }} />
        </div>
        <span className="text-sm font-bold" style={{ color: '#292524' }}>Owner Controls</span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(234,179,8,0.18)', color: '#92400e' }}
        >
          Owner Only
        </span>
      </div>

      {/* Balance */}
      <div className="mb-4 rounded-2xl px-4 py-3" style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.20)' }}>
        <div className="text-xs mb-1" style={{ color: '#78716c' }}>Contract USDC Balance</div>
        <div
          className="text-2xl font-bold tabular-nums"
          style={{ color: '#292524', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {balance != null ? formatUsdc(balance) : '…'} USDC
        </div>
      </div>

      {/* Success state */}
      {isSuccess && hash && (
        <div
          className="rounded-2xl p-3 mb-4 flex items-center justify-between"
          style={{ background: 'rgba(26,128,71,0.08)', border: '1px solid rgba(26,128,71,0.20)' }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" style={{ color: '#1a8047' }} />
            <span className="text-sm font-semibold" style={{ color: '#1a8047' }}>Withdrawal successful</span>
          </div>
          <a
            href={txUrl(hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs"
            style={{ color: '#b45309' }}
          >
            View tx <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      {/* Withdraw button */}
      <button
        onClick={isSuccess ? reset : handleWithdraw}
        disabled={isPending || isEmpty}
        className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
        style={{
          background:
            isPending || isEmpty
              ? '#d4cfc9'
              : 'linear-gradient(135deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%)',
          color: isPending || isEmpty ? '#78716c' : '#fff',
        }}
      >
        {walletPending ? (
          <><Loader2 className="size-4 animate-spin" /> Confirm in wallet…</>
        ) : confirming ? (
          <><Loader2 className="size-4 animate-spin" /> Confirming withdrawal…</>
        ) : isSuccess ? (
          'Withdraw Again'
        ) : isEmpty ? (
          'No USDC to Withdraw'
        ) : (
          `Withdraw ${balance != null ? formatUsdc(balance) : '…'} USDC`
        )}
      </button>
    </div>
  )
}
