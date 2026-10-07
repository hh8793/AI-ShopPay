// 演示商家库：各自拥有入驻商品（对应 catalog.json 中的 merchantId）
import type { Merchant } from '../types'

export const MERCHANTS: Merchant[] = [
  {
    id: 'm-sana-studio',
    name: 'Sana Studio 创作者工作室',
    tagline: '数字会员 · 艺术品 · 创作者打赏',
    icon: '🎨',
  },
  {
    id: 'm-crypto-brew',
    name: 'Crypto Brew 咖啡社',
    tagline: '线下咖啡券 · 到店核销',
    icon: '☕',
  },
  {
    id: 'm-devstack',
    name: 'DevStack 开发者工具',
    tagline: 'SaaS 订阅 · Web3 知识付费',
    icon: '🧰',
  },
]