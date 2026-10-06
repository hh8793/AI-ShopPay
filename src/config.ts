// 运行时配置：全部来自环境变量，缺省值保证零配置即可完整演示（Solana Devnet + 本地引擎）

// Solana RPC：演示默认 Devnet 公开节点；生产/路演可配置 Quicknode Devnet 专属节点
export const RPC_URL: string =
  import.meta.env.VITE_RPC_URL || 'https://api.devnet.solana.com'

// 商户收款地址（演示环境请使用 Devnet 地址；当前为演示专用地址，无真实资金）
export const MERCHANT_ADDRESS: string =
  import.meta.env.VITE_MERCHANT_ADDRESS || '4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZAMdL4VZHjAnb'

// LLM 导购引擎配置：未提供 API Key 时自动降级为本地智能匹配引擎（路演零故障）
export const LLM_PROVIDER: string = import.meta.env.VITE_LLM_PROVIDER || 'openai-compatible'
export const LLM_API_KEY: string = import.meta.env.VITE_LLM_API_KEY || ''
export const LLM_BASE_URL: string =
  import.meta.env.VITE_LLM_BASE_URL || 'https://api.openai.com/v1'
export const LLM_MODEL: string = import.meta.env.VITE_LLM_MODEL || 'gpt-4o-mini'

export const CLUSTER = 'devnet' as const
export const SOL_DECIMALS = 9

// LLM 是否可用：无 Key 则纯本地模式（保证演示稳定）
export const LLM_ENABLED: boolean = LLM_API_KEY.length > 0