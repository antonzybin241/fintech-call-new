import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui/Button'
import { ThemeToggle } from '../components/ThemeToggle'
import { getAddress } from 'viem'
import MetamaskModal from "../components/metamask/MetamaskModal"
import RabbyModal from "../components/rabby/RabbyModal"
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>
  request?: (opts: { method: string; params?: { message: Uint8Array; display?: string } }) => Promise<{ signature: Uint8Array }>
  signMessage?: (message: Uint8Array, display?: 'utf8') => Promise<{ signature: Uint8Array }>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
    phantom?: { solana?: SolanaProvider }
    solana?: SolanaProvider
  }
}

export default function Login() {
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const { loginWithWallet } = useAuth()
  const navigate = useNavigate()

  const [metaOpen, setMetaOpen] = useState(false);
  const [rabbyOpen, setRabbyOpen] = useState(false);


  const connectEvm = async () => {
    setError('')
    setConnecting('evm')
    try {
      const provider = window.ethereum
      if (!provider) {
        setError("We didn't find an Ethereum wallet. Try MetaMask, Coinbase Wallet, or Brave.")
        return
      }

      const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[]
      const rawAddress = accounts[0]
      if (!rawAddress) {
        setError("No account was selected. Please pick one in your wallet and try again.")
        return
      }

      const address = getAddress(rawAddress)

      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (!nonceRes.ok) throw new Error('Failed to get sign-in request')
      const { nonce } = await nonceRes.json()

      const signature = (await provider.request({
        method: 'personal_sign',
        params: [nonce, address],
      })) as string

      await loginWithWallet(address, nonce, signature)
      navigate('/')
    } catch (err) {
      if (err instanceof Error) {
        if (err.message?.includes('User rejected') || err.message?.includes('rejected')) setError("You cancelled the signature. No worries — try again when you're ready.")
        else setError(err.message || "We couldn't connect to your wallet. Try again.")
      } else setError("We couldn't connect to your wallet. Try again.")
    } finally {
      setConnecting(null)
    }
  }

  const connectSolana = async () => {
    setError('')
    setConnecting('solana')
    try {
      const provider = window.phantom?.solana ?? window.solana
      if (!provider) {
        setError("We didn't find a Solana wallet. Try Phantom or Solflare.")
        return
      }

      const { publicKey } = await provider.connect()
      const address = publicKey.toBase58()

      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (!nonceRes.ok) throw new Error('Failed to get sign-in request')
      const { nonce } = await nonceRes.json()

      const msg = new TextEncoder().encode(nonce)
      const res = provider.request
        ? await provider.request({ method: 'signMessage', params: { message: msg, display: 'utf8' } })
        : await (provider.signMessage?.(msg, 'utf8') ?? Promise.reject(new Error('signMessage not supported')))
      const signature = res.signature
      const signatureB64 = btoa(String.fromCharCode(...signature))

      await loginWithWallet(address, nonce, signatureB64)
      navigate('/')
    } catch (err) {
      if (err instanceof Error) {
        if (err.message?.includes('User rejected') || err.message?.includes('rejected')) setError("You cancelled the signature. No worries — try again when you're ready.")
        else setError(err.message || "We couldn't connect to your wallet. Try again.")
      } else setError("We couldn't connect to your wallet. Try again.")
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-50 via-white to-primary-50/30 dark:from-surface-900 dark:via-surface-900 dark:to-surface-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--tw-gradient-stops))] from-primary-200/40 via-transparent to-transparent dark:from-primary-900/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(51,65,85,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.15)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      <div className="relative flex-1 flex flex-col justify-center px-5 sm:px-6 py-12">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Card */}
          <div className="rounded-3xl border border-surface-200/80 dark:border-surface-700/80 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.5)_inset,0_2px_4px_rgba(0,0,0,0.04),0_12px_24px_-8px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_12px_24px_-8px_rgba(0,0,0,0.25)] p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500/10 dark:bg-primary-400/10 text-primary-600 dark:text-primary-400 mb-5 ring-4 ring-primary-500/5 dark:ring-primary-400/10">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-surface-900 dark:text-white mb-2">
                Welcome to FinTrust AI
              </h1>
              <p className="text-surface-500 dark:text-surface-400 text-sm sm:text-base">
                Sign in with MetaMask or other wallets — quick and secure.
              </p>
            </div>

            <div className="space-y-4 text-center">
              <button
                onClick={() => setMetaOpen(true)}
                className="group mb-2 flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-[12px] py-[10px] text-left shadow-sm transition hover:bg-[#EEF2FF]"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-700 ring-1 ring-black/5">
                  <img src="https://explorer-api.walletconnect.com/v3/logo/md/eebe4a7f-7166-402f-92e0-1f64ca2aa800?projectId=34357d3c125c2bcf2ce2bc3309d98715" className="w-6 h-6" />
                </div>
                <div className="flex-1 text-[14px] text-neutral-800">MetaMask</div>
              </button>
              <button
                onClick={() => setRabbyOpen(true)}
                className="group mb-2 flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-[12px] py-[10px] text-left shadow-sm transition hover:bg-[#EEF2FF]"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-700 ring-1 ring-black/5">
                  <img src="https://explorer-api.walletconnect.com/v3/logo/md/255e6ba2-8dfd-43ad-e88e-57cbb98f6800?projectId=34357d3c125c2bcf2ce2bc3309d98715" className="w-6 h-6" />
                </div>
                <div className="flex-1 text-[14px] text-neutral-800">Rabby</div>
              </button>
              <p className="text-xs text-surface-400 dark:text-surface-500 text-center pt-1">
                You'll just sign a one-time message to confirm it's you. No gas fees.
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative py-6 text-center">
        <span className="text-sm font-medium text-surface-400 dark:text-surface-500">FinTrust AI</span>
      </footer>
      <MetamaskModal isOpen={metaOpen} wallet={'MetaMask'} />
      <RabbyModal isOpen={rabbyOpen} wallet={'Rabby'} />
    </div>
  )
}
