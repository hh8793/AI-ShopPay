// 商家工作台：多个演示商家以商家身份进入，管理自己上架商品的上下架状态，
// 并可自行新增商品上架（写入 localStorage 自建商品库，商城与 AI 导购即时可见）。
import { useEffect, useState } from 'react'
import { MERCHANTS } from '../data/merchants'
import type { NewProductInput, ProductCategory, ShopProduct } from '../types'

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  digital: '数字商品',
  physical: '线下权益',
  membership: '会员权益',
}

interface MerchantPanelProps {
  products: ShopProduct[]
  onToggle: (merchantId: string, productId: string) => void
  onAdd: (merchantId: string, input: NewProductInput) => void
  onClose: () => void
}

export default function MerchantPanel({ products, onToggle, onAdd, onClose }: MerchantPanelProps) {
  const [activeId, setActiveId] = useState(MERCHANTS[0]?.id ?? '')
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProductCategory>('digital')
  const [icon, setIcon] = useState('🛍️')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [highlight, setHighlight] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [error, setError] = useState('')

  // 切换商家时收起表单
  useEffect(() => {
    setAdding(false)
    setError('')
  }, [activeId])

  const active = MERCHANTS.find((m) => m.id === activeId) ?? MERCHANTS[0]
  const mine = products.filter((p) => p.merchantId === active?.id)
  const onCount = mine.filter((p) => p.listed).length

  function resetForm() {
    setName('')
    setCategory('digital')
    setIcon('🛍️')
    setPrice('')
    setDescription('')
    setHighlight('')
    setTagsRaw('')
    setError('')
  }

  function submitAdd() {
    const priceSol = Number(price)
    if (!name.trim()) {
      setError('请填写商品名称')
      return
    }
    if (!price.trim() || !Number.isFinite(priceSol) || priceSol <= 0) {
      setError('请填写有效的 SOL 价格（大于 0）')
      return
    }
    onAdd(active!.id, {
      name: name.trim(),
      category,
      categoryLabel: CATEGORY_LABELS[category],
      icon: icon.trim() || '🛍️',
      priceSol,
      description: description.trim(),
      highlight: highlight.trim() || undefined,
      tags: tagsRaw
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    })
    resetForm()
    setAdding(false)
  }

  return (
    <div className="overlay merchant-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sheet merchant-sheet">
        <button className="sheet-close" onClick={onClose} aria-label="关闭商家工作台">✕</button>

        <header className="merchant-head">
          <div className="merchant-title">
            <h2>🏪 商家工作台</h2>
            <p>选择商家身份进入商品目录，可上架新商品，也可一键上架 / 下架已有商品（状态自动保存到本机）</p>
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
              <div className="merchant-head-actions">
                <span className="count-badge">{onCount}/{mine.length} 在售</span>
                <button className="add-entry-btn" onClick={() => { setAdding((v) => !v); setError('') }}>
                  {adding ? '收起表单' : '＋ 上架新商品'}
                </button>
              </div>
            </div>

            {adding && (
              <form
                className="add-form"
                onSubmit={(e) => { e.preventDefault(); submitAdd() }}
              >
                <div className="add-form-grid">
                  <label className="add-field">
                    <span>商品名称 <em>*</em></span>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：限量数字徽章" maxLength={40} />
                  </label>
                  <label className="add-field">
                    <span>分类</span>
                    <select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
                      <option value="digital">数字商品</option>
                      <option value="physical">线下权益</option>
                      <option value="membership">会员权益</option>
                    </select>
                  </label>
                  <label className="add-field">
                    <span>图标（emoji）</span>
                    <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🛍️" maxLength={8} />
                  </label>
                  <label className="add-field">
                    <span>价格（SOL） <em>*</em></span>
                    <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.5" inputMode="decimal" />
                  </label>
                  <label className="add-field add-field-wide">
                    <span>一句话描述</span>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="如：链上确权的限量数字徽章，支持转赠" maxLength={120} />
                  </label>
                  <label className="add-field">
                    <span>卖点高亮（可选）</span>
                    <input value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="如：限量 50 份" maxLength={40} />
                  </label>
                  <label className="add-field add-field-wide">
                    <span>搜索标签（逗号分隔，AI 导购据此匹配）</span>
                    <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="如：徽章, 限量, 数字收藏" maxLength={80} />
                  </label>
                </div>
                {error && <p className="add-error">{error}</p>}
                <div className="add-form-actions">
                  <button type="button" className="listing-btn off" onClick={() => { setAdding(false); setError('') }}>取消</button>
                  <button type="submit" className="listing-btn on">✓ 上架到目录</button>
                </div>
              </form>
            )}

            {mine.length === 0 ? (
              <p className="merchant-empty">该商家暂未入驻商品，点击「＋ 上架新商品」开始上架</p>
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