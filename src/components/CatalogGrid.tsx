// 商品目录：受 App 状态驱动（仅展示上架中的商品），提供「跳过 AI 直接选品支付」降级入口
import type { Product } from '../types'

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

interface CatalogGridProps {
  /** 已过滤为「上架中」的商品列表 */
  products: Product[]
  onBuy: (p: Product) => void
}

export default function CatalogGrid({ products, onBuy }: CatalogGridProps) {
  return (
    <div className="catalog">
      <div className="panel-head">
        <div>
          <h2>商品目录</h2>
          <p className="panel-sub">静态商品库 · 零后端零合约 · 仅展示商家上架商品</p>
        </div>
        <span className="count-badge">{products.length} 件在售</span>
      </div>
      {products.length === 0 ? (
        <div className="grid-empty">暂无在售商品，请商家前往「🏪 商家工作台」上架</div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onBuy={onBuy} />
          ))}
        </div>
      )}
    </div>
  )
}