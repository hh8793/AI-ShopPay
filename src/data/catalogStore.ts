// 商品目录数据层：种子数据 + 浏览器本地持久化（上架/下架状态 与 商家自建商品）。
// 无后端、无数据库约束下的演示方案：
//  - listings 覆盖层（ai-shoppay:listings:v1）：记录上下架差异，种子与自建商品共用
//  - 自建商品（ai-shoppay:custom-products:v1）：商家后续新增上架的商品本体
// 商品基础信息的种子始终来自 catalog.json，新增种子商品可自动出现在目录。

import type { ShopProduct } from '../types'
import seed from './catalog.json'

const LISTINGS_KEY = 'ai-shoppay:listings:v1'
const CUSTOM_KEY = 'ai-shoppay:custom-products:v1'

export const SEED: ShopProduct[] = seed as ShopProduct[]

/** 读取本地持久化的上架/下架覆盖层（损坏或缺失时回退空对象） */
export function loadListings(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LISTINGS_KEY)
    if (raw) return JSON.parse(raw) as Record<string, boolean>
  } catch {
    // 数据损坏时忽略，回退种子默认状态
  }
  return {}
}

/** 读取商家自建商品（损坏或缺失时回退空数组） */
export function loadCustomProducts(): ShopProduct[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as ShopProduct[]
      if (Array.isArray(arr)) return arr
    }
  } catch {
    // 数据损坏时忽略
  }
  return []
}

/** 持久化商家自建商品 */
export function persistCustomProducts(items: ShopProduct[]): void {
  try {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(items))
  } catch {
    // 存储不可用（如隐私模式）时仅内存生效，不影响演示
  }
}

/** 读取完整商品列表：种子商品 + 商家自建商品，统一应用 listings 覆盖层 */
export function loadProducts(): ShopProduct[] {
  const listings = loadListings()
  const apply = (p: ShopProduct): ShopProduct => ({ ...p, listed: listings[p.id] ?? p.listed })
  return [...SEED.map(apply), ...loadCustomProducts().map(apply)]
}

/** 持久化状态覆盖层 */
export function persistListings(listings: Record<string, boolean>): void {
  try {
    localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings))
  } catch {
    // 存储不可用（如隐私模式）时仅内存生效，不影响演示
  }
}

/** 计算切换后的覆盖层：取当前实际状态取反，写入覆盖层 */
export function applyToggle(listings: Record<string, boolean>, id: string): Record<string, boolean> {
  const current = listings[id] ?? SEED.find((p) => p.id === id)?.listed ?? true
  return { ...listings, [id]: !current }
}