// 全局 Solana 基础设施：Devnet RPC 连接 + Phantom 钱包适配器 + 钱包弹窗 UI
import { useMemo, type FC, type ReactNode } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import type { Adapter } from '@solana/wallet-adapter-base'
import { RPC_URL } from '../config'

// wallet-adapter 官方类型声明与 React 18.3 类型环境的兼容性 shim（仅类型层面，不影响运行时行为）
const SafeConnectionProvider = ConnectionProvider as unknown as FC<{
  endpoint: string
  children: ReactNode
}>
const SafeWalletProvider = WalletProvider as unknown as FC<{
  wallets: Adapter[]
  autoConnect?: boolean
  children: ReactNode
}>
const SafeWalletModalProvider = WalletModalProvider as unknown as FC<{
  children: ReactNode
}>

export function SolanaProviders({ children }: { children: ReactNode }) {
  // 路演 MVP 聚焦 Phantom；其他钱包卡片弹出式连接由 WalletModalProvider 提供
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [])

  return (
    <SafeConnectionProvider endpoint={RPC_URL}>
      <SafeWalletProvider wallets={wallets} autoConnect>
        <SafeWalletModalProvider>{children}</SafeWalletModalProvider>
      </SafeWalletProvider>
    </SafeConnectionProvider>
  )
}