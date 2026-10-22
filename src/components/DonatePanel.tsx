/**
 * DonatePanel — full approve→donate flow with preset chips and custom input.
 */

import { useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from 'wagmi'
import { erc20Abi } from 'viem'
import { Loader2, ExternalLink, CheckCircle2, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { DONATION_FI_ADDRESS, DONATION_FI_ABI } from '../contracts/DonationFi'
import {
  ARC_MAINNET_ID,
  USDC_ADDRESS,
  formatUsdc,
  parseUsdc,
  shortAddr,
  txUrl,
  parseError,
} from '../utils/donationFi'

const PRESETS = [5, 10, 25, 50]

type Step = 'idle' | 'approving' | 'approved' | 'donating' | 'done'

export function DonatePanel({ onDonated }: { onDonated: () => void }) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<Step>('idle')
  const [donateHash, setDonateHash] = useState<`0x${string}` | undefined>()

  const isWrongChain = isConnected && chainId !== ARC_MAINNET_ID

  // USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!address },
  })

  // Current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, DONATION_FI_ADDRESS] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!address },
  })

  // Donor's personal total
  const { data: myTotal, refetch: refetchMyTotal } = useReadContract({
    address: DONATION_FI_ADDRESS,
    abi: DONATION_FI_ABI,
    functionName: 'donorTotals',
    args: address ? [address] : undefined,
    chainId: ARC_MAINNET_ID,
    query: { enabled: !!address },
  })

  // Approve write
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: approveWalletPending,
    reset: resetApprove,
  } = useWriteContract()

  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
      chainId: ARC_MAINNET_ID,
      query: { enabled: !!approveHash },
    })

  // Donate write
  const {
    writeContract: writeDonate,
    data: freshDonateHash,
    isPending: donateWalletPending,
    reset: resetDonate,
  } = useWriteContract()

  const { isLoading: donateConfirming, isSuccess: donateSuccess } =
    useWaitForTransactionReceipt({
      hash: freshDonateHash,
      chainId: ARC_MAINNET_ID,
      query: { enabled: !!freshDonateHash },
    })

  // Keep donateHash in state once available
  if (freshDonateHash && freshDonateHash !== donateHash) setDonateHash(freshDonateHash)

  // React to approve success → move to step approved
  if (approveSuccess && step === 'approving') {
    setStep('approved')
    void refetchAllowance()
  }

  // React to donate success
  if (donateSuccess && step === 'donating') {
    setStep('done')
    void refetchAllowance()
    void refetchMyTotal()
    onDonated()
  }

  const parsedAmount = parseUsdc(amount)
  const hasEnough = usdcBalance != null && parsedAmount > 0n && usdcBalance >= parsedAmount
  const alreadyApproved = allowance != null && parsedAmount > 0n && allowance >= parsedAmount

  function handlePreset(usdc: number) {
    setAmount(String(usdc))
    setStep('idle')
    resetApprove()
    resetDonate()
    setDonateHash(undefined)
  }

  function handleApprove() {
    if (!parsedAmount) return
    setStep('approving')
    writeApprove(
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [DONATION_FI_ADDRESS, parsedAmount],
        chainId: ARC_MAINNET_ID,
      },
      {
        onError(err) {
          setStep('idle')
          toast.error(parseError(err))
        },
      },
    )
  }

  function handleDonate() {
    if (!parsedAmount) return
    setStep('donating')
    writeDonate(
      {
        address: DONATION_FI_ADDRESS,
        abi: DONATION_FI_ABI,
        functionName: 'donate',
        args: [parsedAmount],
        chainId: ARC_MAINNET_ID,
      },
      {
        onError(err) {
          setStep('approved')
          toast.error(parseError(err))
        },
      },
    )
  }

  function reset() {
    setAmount('')
    setStep('idle')
    resetApprove()
    resetDonate()
    setDonateHash(undefined)
  }

  const isProcessing =
    approveWalletPending || approveConfirming || donateWalletPending || donateConfirming

  // ── Render ─────────────────────────────────────────────────────────────
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="flex size-7 items-center justify-center rounded-xl"
          style={{ background: 'rgba(234,179,8,0.14)' }}
        >
          <Heart className="size-4" style={{ color: '#b45309' }} />
        </div>
        <span className="text-sm font-bold" style={{ color: '#292524' }}>
          Make a Donation
        </span>
        {address && (
          <span className="ml-auto text-xs font-mono" style={{ color: '#a8a29e' }}>
            {shortAddr(address)}
          </span>
        )}
      </div>

      {step === 'done' ? (
        <DoneState hash={donateHash} onReset={reset} myTotal={myTotal} />
      ) : (
        <>
          {/* Balance row */}
          {address && (
            <div className="mb-3 text-xs" style={{ color: '#78716c' }}>
              Your USDC balance:{' '}
              <span className="font-semibold tabular-nums" style={{ color: '#292524' }}>
                {usdcBalance != null ? formatUsdc(usdcBalance) : '…'} USDC
              </span>
              {myTotal != null && myTotal > 0n && (
                <span className="ml-3">
                  You've donated:{' '}
                  <span className="font-semibold tabular-nums" style={{ color: '#b45309' }}>
                    {formatUsdc(myTotal)} USDC
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Preset chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {PRESETS.map((usdc) => (
              <button
                key={usdc}
                onClick={() => handlePreset(usdc)}
                disabled={isProcessing}
                className="rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40"
                style={{
                  background:
                    amount === String(usdc)
                      ? 'linear-gradient(135deg,#d97706,#f59e0b)'
                      : 'rgba(234,179,8,0.10)',
                  color: amount === String(usdc) ? '#fff' : '#92400e',
                  border: `1px solid ${
                    amount === String(usdc) ? 'transparent' : 'rgba(234,179,8,0.25)'
                  }`,
                }}
              >
                ${usdc}
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <div
            className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2"
            style={{
              background: 'rgba(234,179,8,0.06)',
              border: '1px solid rgba(234,179,8,0.20)',
            }}
          >
            <span className="text-sm font-semibold" style={{ color: '#a8a29e' }}>$</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '')
                if (v === '' || /^\d*\.?\d*$/.test(v)) {
                  setAmount(v)
                  if (step !== 'idle') setStep('idle')
                }
              }}
              placeholder="Custom amount"
              disabled={isProcessing}
              className="flex-1 bg-transparent text-xl font-bold tabular-nums outline-none placeholder:text-stone-300 disabled:opacity-50"
              style={{ color: '#292524', fontFamily: "'Space Grotesk', sans-serif" }}
            />
            <span className="text-sm font-medium" style={{ color: '#a8a29e' }}>USDC</span>
          </div>

          {/* Wrong chain banner */}
          {isWrongChain && (
            <div
              className="rounded-2xl p-3 mb-4 flex items-center justify-between"
              style={{
                background: 'rgba(186,43,76,0.08)',
                border: '1px solid rgba(186,43,76,0.20)',
              }}
            >
              <span className="text-sm" style={{ color: '#ba2b4c' }}>
                Switch to Arc Mainnet to donate.
              </span>
              <button
                onClick={() => switchChain({ chainId: ARC_MAINNET_ID })}
                disabled={isSwitching}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: '#ba2b4c', color: '#fff' }}
              >
                {isSwitching ? 'Switching…' : 'Switch Network'}
              </button>
            </div>
          )}

          {/* Step indicator */}
          {parsedAmount > 0n && !isWrongChain && (
            <div className="flex gap-2 items-center mb-4 text-xs" style={{ color: '#a8a29e' }}>
              <StepDot
                active={step === 'idle' || step === 'approving'}
                done={step === 'approved' || step === 'donating'}
                label="1. Approve USDC"
              />
              <div className="flex-1 h-px" style={{ background: 'rgba(18,45,69,0.12)' }} />
              <StepDot
                active={step === 'approved' || step === 'donating'}
                done={false}
                label="2. Donate"
              />
            </div>
          )}

          {/* CTA */}
          <ActionButton
            isConnected={isConnected}
            isWrongChain={!!isWrongChain}
            parsedAmount={parsedAmount}
            hasEnough={hasEnough}
            alreadyApproved={alreadyApproved}
            step={step}
            approveWalletPending={approveWalletPending}
            approveConfirming={approveConfirming}
            donateWalletPending={donateWalletPending}
            donateConfirming={donateConfirming}
            onApprove={handleApprove}
            onDonate={handleDonate}
            onSwitch={() => switchChain({ chainId: ARC_MAINNET_ID })}
          />

          {/* Approve tx link */}
          {approveHash && (
            <a
              href={txUrl(approveHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1 text-xs"
              style={{ color: '#b45309' }}
            >
              Approval tx <ExternalLink className="size-3" />
            </a>
          )}
        </>
      )}
    </div>
  )
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <span
      className="font-semibold"
      style={{
        color: done ? '#b45309' : active ? '#292524' : '#d4cfc9',
      }}
    >
      {label}
    </span>
  )
}

function ActionButton({
  isConnected,
  isWrongChain,
  parsedAmount,
  hasEnough,
  alreadyApproved,
  step,
  approveWalletPending,
  approveConfirming,
  donateWalletPending,
  donateConfirming,
  onApprove,
  onDonate,
  onSwitch,
}: {
  isConnected: boolean
  isWrongChain: boolean
  parsedAmount: bigint
  hasEnough: boolean
  alreadyApproved: boolean
  step: Step
  approveWalletPending: boolean
  approveConfirming: boolean
  donateWalletPending: boolean
  donateConfirming: boolean
  onApprove: () => void
  onDonate: () => void
  onSwitch: () => void
}) {
  const isPending =
    approveWalletPending || approveConfirming || donateWalletPending || donateConfirming

  let label: React.ReactNode = 'Donate'
  let disabled = false
  let handler = onDonate

  if (!isConnected) {
    label = 'Connect Wallet to Donate'
    disabled = true
  } else if (isWrongChain) {
    label = 'Switch to Arc Mainnet'
    handler = onSwitch
  } else if (parsedAmount === 0n) {
    label = 'Enter an amount'
    disabled = true
  } else if (!hasEnough) {
    label = 'Insufficient USDC balance'
    disabled = true
  } else if (step === 'approving' && approveWalletPending) {
    label = <Spinner>Confirm approval in wallet…</Spinner>
    disabled = true
  } else if (step === 'approving' && approveConfirming) {
    label = <Spinner>Approving USDC…</Spinner>
    disabled = true
  } else if (!alreadyApproved && step !== 'approved') {
    label = `Approve ${formatUsdc(parsedAmount)} USDC`
    handler = onApprove
  } else if (step === 'donating' && donateWalletPending) {
    label = <Spinner>Confirm donation in wallet…</Spinner>
    disabled = true
  } else if (step === 'donating' && donateConfirming) {
    label = <Spinner>Confirming donation…</Spinner>
    disabled = true
  } else {
    label = `Donate ${formatUsdc(parsedAmount)} USDC`
  }

  return (
    <button
      onClick={() => {
        if (!disabled && !isPending) handler()
      }}
      disabled={disabled || isPending}
      className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center"
      style={{
        background:
          disabled || isPending
            ? '#d4cfc9'
            : 'linear-gradient(135deg, #d97706 0%, #f59e0b 60%, #fbbf24 100%)',
        color: disabled || isPending ? '#78716c' : '#fff',
      }}
    >
      {label}
    </button>
  )
}

function Spinner({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      {children}
    </span>
  )
}

function DoneState({
  hash,
  onReset,
  myTotal,
}: {
  hash: `0x${string}` | undefined
  onReset: () => void
  myTotal: bigint | undefined
}) {
  return (
    <div className="flex flex-col items-center py-4 gap-4">
      <div
        className="size-14 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(26,128,71,0.12)' }}
      >
        <CheckCircle2 className="size-7" style={{ color: '#1a8047' }} />
      </div>
      <div className="text-center">
        <div className="text-base font-bold mb-1" style={{ color: '#292524' }}>
          Donation confirmed!
        </div>
        <div className="text-xs" style={{ color: '#78716c' }}>
          {myTotal != null && myTotal > 0n
            ? `You've donated a total of ${formatUsdc(myTotal)} USDC to this campaign.`
            : 'Thank you for supporting this campaign.'}
        </div>
      </div>
      {hash && (
        <a
          href={txUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-semibold transition-all hover:opacity-80"
          style={{ color: '#b45309' }}
        >
          View on Arc Explorer <ExternalLink className="size-3.5" />
        </a>
      )}
      <button
        onClick={onReset}
        className="rounded-2xl px-6 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(234,179,8,0.12)',
          color: '#92400e',
          border: '1px solid rgba(234,179,8,0.25)',
        }}
      >
        Donate Again
      </button>
    </div>
  )
}
