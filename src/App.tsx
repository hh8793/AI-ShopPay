// 应用主框架：顶部钱包栏 + 商家工作台入口 + AI 导购对话 + 商品目录 + 支付面板
// 商品数据统一由 App 持有（种子 + localStorage 上架状态），商家工作台与商城目录共享同一状态。
import { useState } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import ChatPanel from './components/ChatPanel'
import CatalogGrid from './components/CatalogGrid'
import PaySheet from './components/PaySheet'
import MerchantPanel from './components/MerchantPanel'
import type { Product, ShopProduct } from './types'
import { loadProducts, loadListings, applyToggle, persistListings } from './data/catalogStore'

export default function App() {
  const [paying, setPaying] = useState<Product | null>(null)
  const [merchantOpen, setMerchantOpen] = useState(false)
  const [products, setProducts] = useState<ShopProduct[]>(() => loadProducts())

  const openPay = (p: Product) => setPaying(p)
  const closePay = () => setPaying(null)

  /** 商城可见商品 = 仅上架中；目录、AI 导购、购买链路均使用该集合 */
  const listedProducts = products.filter((p) => p.listed)

  /** 商家上下架：只允许操作自己名下的商品，变更即时写入 localStorage。
   *  注意：持久化副作用必须在 updater 之外执行（StrictMode 开发模式会双重调用 updater，
   *  若在 updater 内读写 localStorage 会因读到上一次写入而状态翻转）。 */
  const toggleListing = (merchantId: string, productId: string) => {
    const target = products.find((p) => p.id === productId)
    if (!target || target.merchantId !== merchantId) return
    const next = applyToggle(loadListings(), productId)
    persistListings(next)
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, listed: !p.listed } : p)))
  }

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
          <button className="merchant-entry" onClick={() => setMerchantOpen(true)}>
            🏪 商家工作台
          </button>
          <WalletMultiButton className="wallet-btn" />
        </div>
      </header>

      <main className="layout">
        <section className="panel chat-panel">
          <ChatPanel products={listedProducts} onBuy={openPay} />
        </section>
        <section className="panel catalog-panel">
          <CatalogGrid products={listedProducts} onBuy={openPay} />
        </section>
      </main>

      <footer className="footer">
        <span>🏆 KAST Real-World Utility 专项</span>
        <span>⚡ 零自定义合约 · 标准 Solana Pay 协议</span>
        <span>🛠 7 小时 Vibe Coding MVP · 静态商品库零运维</span>
      </footer>

      <PaySheet key={paying?.id ?? 'closed'} product={paying} onClose={closePay} />
      {merchantOpen && (
        <MerchantPanel products={products} onToggle={toggleListing} onClose={() => setMerchantOpen(false)} />
      )}
    </div>
  )
}