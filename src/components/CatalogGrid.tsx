// 商品目录：静态 JSON 商品库驱动的卡片网格，提供「跳过 AI 直接选品支付」降级入口
import type { Product } from '../types'
import catalog from '../data/catalog.json'

function ProductCard({ product, onBuy }: { product: Product; onBuy: (p: Product) => void }) {
  return (
    <article className="card">
      <div className="card-top">
        <span className="card-icon">{product.icon}</span>
        <span className="card-cat">{product.categoryLabel}</span>
      </div>
      <h3>{product.name}</h3>
      {product.highlight && <span className="card-highlight">{product.highlight}</span>}
      <p className="card-desc">{product.description}</p>
      <div className="card-foot">
        <span className="price">
          <strong>{product.priceSol}</strong> SOL
        </span>
        <button className="buy-btn" onClick={() => onBuy(product)}>
          立即购买
        </button>
      </div>
    </article>
  )
}

export default function CatalogGrid({ onBuy }: { onBuy: (p: Product) => void }) {
  const products = catalog as Product[]
  return (
    <div className="catalog">
      <div className="panel-head">
        <div>
          <h2>商品目录</h2>
          <p className="panel-sub">静态商品库 · 零后端零合约 · 支持跳过 AI 直接选品支付</p>
        </div>
        <span className="count-badge">{products.length} 件商品</span>
      </div>
      <div className="grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onBuy={onBuy} />
        ))}
      </div>
    </div>
  )
}