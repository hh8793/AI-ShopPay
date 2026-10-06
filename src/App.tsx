// 应用主框架：顶部钱包栏 + AI 导购对话 + 商品目录 + 支付面板
import { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import ChatPanel from './components/ChatPanel'
import CatalogGrid from './components/CatalogGrid'
import PaySheet from './components/PaySheet'
import type { Product } from './types'

export default function App() {
  const [paying, setPaying] = useState<Product | null>(null)

  const openPay = (p: Product) => setPaying(p)
  const closePay = () => setPaying(null)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">🪙</span>
          <div className="brand-text">
            <h1>
              AI ShopPay <span className="brand-accent">on Solana</span>
            </h1>
            <p>AI 自然语言导购 × Solana Pay 真实世界支付系统</p>
          </div>
        </div>
        <div className="topbar-right">
          <span className="network-badge">Solana Devnet</span>
          <WalletMultiButton className="wallet-btn" />
        </div>
      </header>

      <main className="layout">
        <section className="panel chat-panel">
          <ChatPanel onBuy={openPay} />
        </section>
        <section className="panel catalog-panel">
          <CatalogGrid onBuy={openPay} />
        </section>
      </main>

      <footer className="footer">
        <span>🏆 KAST Real-World Utility 专项</span>
        <span>⚡ 零自定义合约 · 标准 Solana Pay 协议</span>
        <span>🛠 7 小时 Vibe Coding MVP · 静态商品库零运维</span>
      </footer>

      <PaySheet key={paying?.id ?? 'closed'} product={paying} onClose={closePay} />
    </div>
  )
}