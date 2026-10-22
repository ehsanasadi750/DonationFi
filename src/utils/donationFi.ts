/**
 * DonationFi — shared utilities: formatting, error parsing, Arc Mainnet facts.
 */

import { getUsdc } from '@/onchain-facts'

// Arc Mainnet chain id
export const ARC_MAINNET_ID = 5042 as const

// USDC on Arc (same address on testnet and mainnet)
export const USDC_ADDRESS = getUsdc(ARC_MAINNET_ID)?.address as `0x${string}`
export const USDC_DECIMALS = 6

// Campaign goal in USDC (display only)
export const CAMPAIGN_GOAL_USDC = 5_000

/** Parse raw uint256 USDC amount → human-readable string with 2 dp */
export function formatUsdc(raw: bigint | undefined | null): string {
  if (raw == null) return '0.00'
  const n = Number(raw) / 1e6
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Parse a string like "25" into 6-decimal raw bigint */
export function parseUsdc(value: string): bigint {
  const n = parseFloat(value)
  if (!isFinite(n) || n <= 0) return 0n
  return BigInt(Math.round(n * 1e6))
}

/** Shorten 0xabc…xyz */
export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

/** Arc Mainnet explorer URLs */
export const explorerBase = 'https://explorer.arc.io'
export function txUrl(hash: string) { return `${explorerBase}/tx/${hash}` }
export function addrUrl(addr: string) { return `${explorerBase}/address/${addr}` }

/** Parse onchain errors into friendly messages */
export function parseError(error: unknown): string {
  const msg = (error as Error)?.message?.toLowerCase() ?? ''
  if (msg.includes('user rejected') || msg.includes('4001')) return 'Transaction cancelled.'
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance'))
    return 'Insufficient USDC balance.'
  if (msg.includes('zerodonation') || msg.includes('zero donation'))
    return 'Donation amount must be greater than zero.'
  if (msg.includes('notowner')) return 'Only the contract owner can do this.'
  if (msg.includes('nothingtowithdrw') || msg.includes('nothingtowithdraw'))
    return 'No USDC available to withdraw.'
  if (msg.includes('transferfailed')) return 'USDC transfer failed — check your approval.'
  if (msg.includes('reverted')) return 'Transaction reverted. Check your balance and approval.'
  if (msg.includes('network') || msg.includes('timeout'))
    return 'Network error. Check your connection and retry.'
  return 'Something went wrong. Please try again.'
}

/** Progress toward CAMPAIGN_GOAL_USDC (0–1) */
export function goalProgress(totalDonated: bigint | undefined): number {
  if (!totalDonated) return 0
  const pct = Number(totalDonated) / 1e6 / CAMPAIGN_GOAL_USDC
  return Math.min(pct, 1)
}
