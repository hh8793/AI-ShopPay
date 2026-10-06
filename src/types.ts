// 全局类型定义：商品、聊天消息、支付状态

export type ProductCategory = 'digital' | 'physical' | 'membership'

export interface Product {
  id: string
  name: string
  category: ProductCategory
  categoryLabel: string
  icon: string
  priceSol: number
  priceLamports: number
  description: string
  highlight?: string
  tags: string[]
}

export type EngineKind = 'llm' | 'local'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  engine?: EngineKind
  products?: Product[]
}

export interface ChatResult {
  reply: string
  products: Product[]
  engine: EngineKind
}

// 支付面板状态机
export type PayPhase = 'idle' | 'preparing' | 'ready' | 'signing' | 'confirming' | 'success' | 'error'

export interface PaySession {
  product: Product
  payUrl: string
  reference: string
  phase: PayPhase
  signature?: string
  error?: string
  confirmedAt?: number
  durationMs?: number
}