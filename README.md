# AI ShopPay on Solana

**AI 自然语言导购 × Solana Pay 真实世界支付系统** —— KAST $250,000 Real-World Utility 专项 · 成都 Vibe Coding Day 参赛项目

> 一套自然语言驱动的 Web3 导购支付系统：用户通过对话即可购物，AI 自动匹配商品并生成 Solana Pay 支付链路，实现零门槛链上消费。

---

## 功能特性

- **AI 自然语言导购**：聊天式交互，口语化需求自动匹配商品（支持大模型增强，缺省本地智能引擎零故障路演）
- **轻量化商品体系**：`src/data/catalog.json` 静态商品库，零后端、零数据库、零运维
- **全自动 Solana Pay 支付链路**：一键生成支付二维码 + `solana:` 支付链接，支持 Phantom 钱包扫码
- **链上交易存证**：支付成功展示 TxHash + Solscan Devnet 溯源凭证
- **AI 故障降级**：可跳过 AI 直接选品支付，保证路演 100% 成功
- **零自定义合约**：全程 Solana 官方 Solana Pay 标准协议，无审计风险

## 技术栈

React 18 + Vite 5 + TypeScript ｜ @solana/pay（Solana Pay SDK）｜ @solana/web3.js ｜ @solana/wallet-adapter（Phantom）｜ Quicknode RPC（可配置）｜ LLM（OpenAI 兼容 / Anthropic，可选）｜ 静态 JSON 商品库

## 快速开始

```bash
npm install          # 安装依赖（npmmirror 或默认源均可）
cp .env.example .env # 可选：按需配置 RPC / 商户地址 / LLM
npm run dev          # 本地开发预览 http://localhost:5173
npm run build        # 生产构建（tsc 类型检查 + vite build，产物在 dist/）
npm run preview      # 预览构建产物
```

> 缺省配置即可完整演示：不配 `.env` 时自动使用 Solana Devnet 公共 RPC 与本地智能匹配引擎，无需任何 API Key。

## 环境配置（.env.example）

| 变量 | 说明 | 缺省值 |
| --- | --- | --- |
| `VITE_RPC_URL` | Solana RPC 节点（Devnet） | `https://api.devnet.solana.com`，可替换 Quicknode Devnet 专属节点提升速度 |
| `VITE_MERCHANT_ADDRESS` | 商户收款地址（Base58） | 演示用 Devnet 地址（已内置） |
| `VITE_LLM_PROVIDER` | 导购引擎：`openai-compatible` / `anthropic` / `local` | `openai-compatible`（Key 留空自动降级 `local`） |
| `VITE_LLM_API_KEY` | LLM 密钥（留空则本地引擎） | 空 |
| `VITE_LLM_BASE_URL` | LLM 端点 | `https://api.openai.com/v1` |
| `VITE_LLM_MODEL` | 模型名 | `gpt-4o-mini` |

> ⚠️ 浏览器直连 LLM 会把密钥暴露在客户端，仅适用于 MVP 路演与 Demo；生产环境请将 LLM 收敛到服务端代理。

## 3 分钟标准 Demo 流程

1. `npm run dev` 打开应用（Chrome / Edge，建议电脑与手机同 Wi-Fi）
2. 点顶栏「Select Wallet」→ 连接 Phantom 钱包，切换至 **Solana Devnet**（需在 Phantom 设置中开启 Devnet，测试网地址可在钱包内申请空投）
3. 向 AI 导购输入自然语言，例如：**「我想买一张数字 NFT 会员卡」** 或点击建议指令「来一杯咖啡」
4. AI 自动匹配商品，聊天区展示商品介绍与 SOL 价格
5. 点击商品卡片「购买」→ 弹出支付面板，自动生成 **Solana Pay 二维码**与支付链接
6. 手机 Phantom 扫码（或点击「Select Wallet」一键发起交易）→ 钱包确认，交易实时上链
7. 支付成功视图展示 **TxHash + Solscan 链上凭证**，完成商业支付闭环

> 演示兜底：在「商品目录」区可跳过 AI，直接点任意商品「立即购买」，路径与 AI 导购完全一致，杜绝路演翻车。

## 工程结构

```
ai-shoppay/
├── index.html
├── vite.config.ts
├── .env.example            # 环境配置模板（RPC / 商户地址 / LLM）
├── src/
│   ├── main.tsx            # 入口（钱包 Provider + 支付上下文）
│   ├── App.tsx             # 顶栏 + AI 导购 + 商品目录布局
│   ├── config.ts           # 运行时环境配置读取
│   ├── types.ts            # 商品等共享类型
│   ├── data/catalog.json   # ★ 静态商品库（商户只需维护此文件）
│   ├── engine/
│   │   ├── shopAssistant.ts # 导购编排：LLM 优先，失败自动降级本地
│   │   ├── llmClient.ts     # OpenAI 兼容 / Anthropic 双协议客户端（12s 超时）
│   │   └── localMatcher.ts  # 本地关键词 + 加权评分匹配引擎
│   ├── solana/
│   │   ├── pay.ts           # Solana Pay：支付 URL 编码 / 二维码 / 确认轮询 / Solscan 链接
│   │   └── context.tsx      # Phantom Wallet Adapter 连接上下文
│   └── components/
│       ├── ChatPanel.tsx    # 聊天式 AI 导购面板 + 推荐卡片
│       ├── CatalogGrid.tsx  # 商品目录网格（跳过 AI 直选）
│       └── PaySheet.tsx     # 支付面板：二维码 / 钱包支付 / 成功存证视图
```

## 工程边界与风险控制

- MVP 仅聚焦购物支付闭环：不开发库存、订单系统、物流、后台管理
- 全部演示运行在 **Solana Devnet**，无真实资金风险
- AI 接口配备降级方案（LLM 超时/失败 → 本地引擎；任一环节异常可跳过 AI 选品），杜绝路演故障
- 商户地址为演示用 Devnet 公钥，上线前替换为真实商户地址并在 `.env` 中声明

## 未来拓展

商户后台、SPL 多币种支付、线下门店扫码导购、用户订单系统、链上数据商业分析 —— 打造 Solana 生态真实世界零售支付基础设施。