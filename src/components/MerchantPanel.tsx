// 商家工作台：多个演示商家以商家身份进入，管理自己上架商品的上下架状态。
// 状态变更通过 App 层的 toggleListing 写入 localStorage，商城目录与 AI 导购实时联动。
import { useState } from 'react'
import { MERCHANTS } from '../data/merchants'
import type { ShopProduct } from '../types'

interface MerchantPanelProps {
  products: ShopProduct[]
  onToggle: (merchantId: string, productId: string) => void
  onClose: () => void
}

export default function MerchantPanel({ products, onToggle, onClose }: MerchantPanelProps) {
  const [activeId, setActiveId] = useState(MERCHANTS[0]?.id ?? '')

  const active = MERCHANTS.find((m) => m.id === activeId) ?? MERCHANTS[0]
  const mine = products.filter((p) => p.merchantId === active?.id)
  const onCount = mine.filter((p) => p.listed).length

  return (
    <div className="overlay merchant-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet merchant-sheet">
        <button className="sheet-close" onClick={onClose} aria-label="关闭商家工作台">✕</button>

        <header className="merchant-head">
          <div className="merchant-title">
            <h2>🏪 商家工作台</h2>
            <p>选择商家身份进入商品目录，一键上架 / 下架自己的商品（状态自动保存到本机）</p>
          </div>
        </header>

        <div className="merchant-body">
          <aside className="merchant-side">
            {MERCHANTS.map((m) => {
              const mineNow = products.filter((p) => p.merchantId === m.id)
              const onNow = mineNow.filter((p) => p.listed).length
              return (
                <button
                  key={m.id}
                  className={`merchant-item${m.id === active?.id ? ' active' : ''}`}
                  onClick={() => setActiveId(m.id)}
                >
                  <span className="merchant-avatar">{m.icon}</span>
                  <span className="merchant-info">
                    <strong>{m.name}</strong>
                    <small>{m.tagline}</small>
                  </span>
                  <span className="merchant-stat">{onNow}/{mineNow.length} 在售</span>
                </button>
              )
            })}
          </aside>

          <section className="merchant-main">
            <div className="merchant-main-head">
              <h3>{active?.icon} {active?.name} 的商品</h3>
              <span className="count-badge">{onCount}/{mine.length} 在售</span>
            </div>

            {mine.length === 0 ? (
              <p className="merchant-empty">该商家暂未入驻商品</p>
            ) : (
              <ul className="merchant-list">
                {mine.map((p) => (
                  <li key={p.id} className={`merchant-row${p.listed ? '' : ' off'}`}>
                    <span className="merchant-row-icon">{p.icon}</span>
                    <div className="merchant-row-info">
                      <strong>{p.name}</strong>
                      <small>{p.categoryLabel} · {p.priceSol} SOL · @{p.merchantId}</small>
                    </div>
                    <span className={`status-pill ${p.listed ? 'on' : 'off'}`}>
                      {p.listed ? '已上架' : '已下架'}
                    </span>
                    <button
                      className={`listing-btn ${p.listed ? 'off' : 'on'}`}
                      onClick={() => onToggle(active!.id, p.id)}
                    >
                      {p.listed ? '下架' : '上架'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}