<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

interface Goods {
  goods_id: string
  name: string
  description?: string
  payable_amount?: string | number
  credits_count?: number
  type?: string
  subscription_plan?: { name?: string; duration_days?: number } | null
}

const props = defineProps<{
  modelValue: boolean
  dataServerBaseUrl: string
  accessToken: string
  authorizationScheme: 'Bearer' | 'Api-Key'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const goods = ref<Goods[]>([])
const selectedGoodsId = ref('')
const loadingGoods = ref(false)
const creatingPayment = ref(false)
const verifyingPayment = ref(false)
const errorMessage = ref('')
const verifyMessage = ref('')
const verifyState = ref<'idle' | 'pending' | 'success' | 'error'>('idle')
const mode = ref<'shop' | 'result'>('shop')
const orderId = ref('')

const selectedGoods = computed(() => goods.value.find(item => item.goods_id === selectedGoodsId.value))
const formattedPrice = computed(() => {
  const amount = Number(selectedGoods.value?.payable_amount ?? 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '--'
})

function authHeaders() {
  return props.accessToken
    ? { Authorization: `${props.authorizationScheme} ${props.accessToken}` }
    : {}
}

async function requestJson(path: string, init: RequestInit = {}) {
  if (!props.dataServerBaseUrl) throw new Error('未配置数据服务地址')
  const response = await fetch(`${props.dataServerBaseUrl}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  })
  const payload = await response.json().catch(() => ({})) as Record<string, any>
  if (!response.ok) throw new Error(payload.error || payload.detail || payload.message || `请求失败（${response.status}）`)
  return payload
}

async function loadGoods() {
  if (!props.dataServerBaseUrl) return
  loadingGoods.value = true
  errorMessage.value = ''
  try {
    const payload = await requestJson('/credits/goods_detail/')
    const list = Array.isArray(payload) ? payload : payload.results || payload.data || []
    goods.value = list
    if (!selectedGoodsId.value && goods.value.length) selectedGoodsId.value = goods.value[0].goods_id
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '商品加载失败'
  } finally {
    loadingGoods.value = false
  }
}

function openCheckout(response: unknown) {
  const checkout = String(response ?? '').trim()
  if (!checkout) throw new Error('支付宝未返回收银台地址')
  if (/^https?:\/\//i.test(checkout)) {
    window.location.assign(checkout)
    return
  }
  // page_execute may return a complete auto-submit form. Keep navigation in
  // this tab so the return URL can restore the short-lived Bearer session.
  document.open()
  document.write(checkout)
  document.close()
}

async function createPayment() {
  if (!props.accessToken) {
    errorMessage.value = '请先登录后再购买'
    return
  }
  if (!selectedGoods.value) {
    errorMessage.value = '请选择商品'
    return
  }
  creatingPayment.value = true
  errorMessage.value = ''
  try {
    const payload = await requestJson('/credits/payments/alipay/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goods_id: selectedGoods.value.goods_id, http_method: 'GET' }),
    })
    openCheckout(payload.response)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建支付订单失败'
  } finally {
    creatingPayment.value = false
  }
}

function wait(milliseconds: number) {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds))
}

async function verifyPayment() {
  if (!orderId.value) {
    verifyState.value = 'error'
    verifyMessage.value = '缺少订单号，无法确认支付结果'
    return
  }
  if (!props.accessToken) {
    verifyState.value = 'error'
    verifyMessage.value = '登录状态已失效，请重新登录后在订单中心确认'
    return
  }
  verifyingPayment.value = true
  verifyState.value = 'pending'
  verifyMessage.value = '正在等待支付宝异步通知...'
  try {
    let lastError = '支付尚未完成'
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const payload = await requestJson('/credits/payments/alipay/verify/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId.value }),
        })
        verifyState.value = 'success'
        verifyMessage.value = payload.message || '支付成功，权益已到账'
        return
      } catch (error) {
        lastError = error instanceof Error ? error.message : '支付尚未完成'
        if (attempt < 5) await wait(2000)
      }
    }
    verifyState.value = 'error'
    verifyMessage.value = `${lastError}，请稍后重试确认`
  } finally {
    verifyingPayment.value = false
  }
}

function handleDialogChange(value: boolean) {
  emit('update:modelValue', value)
  if (value && mode.value === 'shop' && !goods.value.length) void loadGoods()
}

onMounted(() => {
  const url = new URL(window.location.href)
  if (!url.pathname.includes('/payment/result')) return
  mode.value = 'result'
  orderId.value = url.searchParams.get('out_trade_no') || url.searchParams.get('order_id') || ''
  emit('update:modelValue', true)
  void verifyPayment()
})

watch(() => props.modelValue, value => {
  if (value && mode.value === 'shop' && !goods.value.length) void loadGoods()
})
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'result' ? '支付结果' : '购买服务'"
    width="min(720px, calc(100vw - 28px))"
    :close-on-click-modal="false"
    destroy-on-close
    @update:model-value="handleDialogChange"
  >
    <template v-if="mode === 'result'">
      <div class="payment-result" :class="`is-${verifyState}`">
        <div class="payment-result__icon">{{ verifyState === 'success' ? '✓' : verifyState === 'pending' ? '…' : '!' }}</div>
        <h3>{{ verifyState === 'success' ? '支付成功' : verifyState === 'pending' ? '确认支付中' : '支付结果待确认' }}</h3>
        <p>{{ verifyMessage }}</p>
        <small v-if="orderId">订单号：{{ orderId }}</small>
        <el-button type="primary" :loading="verifyingPayment" @click="verifyPayment">重新确认</el-button>
      </div>
    </template>

    <template v-else>
      <div class="payment-intro">
        <div>
          <strong>选择套餐</strong>
          <p>支付宝支付完成后，积分或会员权益会自动到账。</p>
        </div>
        <span class="payment-intro__secure">支付宝 · RSA2</span>
      </div>
      <el-alert v-if="!accessToken" title="请先登录" description="登录后才能创建支付订单。" type="info" show-icon :closable="false" />
      <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" />
      <div v-if="loadingGoods" class="payment-loading">正在加载商品...</div>
      <div v-else-if="goods.length" class="goods-grid">
        <button
          v-for="item in goods"
          :key="item.goods_id"
          type="button"
          class="goods-option"
          :class="{ 'is-selected': selectedGoodsId === item.goods_id }"
          @click="selectedGoodsId = item.goods_id"
        >
          <span class="goods-option__top"><strong>{{ item.name }}</strong><b>￥{{ Number(item.payable_amount ?? 0).toFixed(2) }}</b></span>
          <span class="goods-option__description">{{ item.description || '服务套餐' }}</span>
          <span class="goods-option__meta">{{ item.type === 'membership' ? (item.subscription_plan?.name || '会员套餐') : `${item.credits_count ?? 0} 积分` }}</span>
        </button>
      </div>
      <el-empty v-else description="暂无可购买商品" />
      <div v-if="selectedGoods" class="payment-summary">
        <div><span>应付金额</span><strong>￥{{ formattedPrice }}</strong></div>
        <el-button type="primary" :loading="creatingPayment" :disabled="!accessToken" @click="createPayment">使用支付宝支付</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.payment-intro, .payment-intro__secure, .goods-option__top, .payment-summary, .payment-result { display: flex; }
.payment-intro { align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.payment-intro strong { font-size: 17px; color: var(--aoles-color-text); }
.payment-intro p { margin: 5px 0 0; color: var(--aoles-color-text-muted); font-size: 12px; }
.payment-intro__secure { flex-shrink: 0; align-items: center; min-height: 24px; padding: 0 8px; border-radius: 4px; color: #087443; background: #e8f7ef; font-size: 11px; }
.goods-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
.goods-option { min-width: 0; padding: 14px; border: 1px solid var(--aoles-color-border); border-radius: 7px; background: var(--aoles-color-surface); color: var(--aoles-color-text); text-align: left; cursor: pointer; transition: border-color .2s, box-shadow .2s; }
.goods-option:hover, .goods-option.is-selected { border-color: var(--aoles-color-primary); box-shadow: 0 0 0 2px color-mix(in srgb, var(--aoles-color-primary) 14%, transparent); }
.goods-option__top { align-items: center; justify-content: space-between; gap: 8px; }
.goods-option__top strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goods-option__top b { flex-shrink: 0; color: var(--aoles-color-primary); font-size: 15px; }
.goods-option__description, .goods-option__meta { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goods-option__description { margin-top: 8px; color: var(--aoles-color-text-muted); font-size: 12px; }
.goods-option__meta { margin-top: 10px; color: var(--aoles-color-text-muted); font-size: 11px; }
.payment-summary { align-items: center; justify-content: space-between; gap: 16px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--aoles-color-border); }
.payment-summary div { display: flex; align-items: baseline; gap: 10px; color: var(--aoles-color-text-muted); font-size: 12px; }
.payment-summary strong { color: var(--aoles-color-text); font-size: 20px; }
.payment-loading { padding: 32px 0; color: var(--aoles-color-text-muted); text-align: center; }
.payment-result { min-height: 260px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; }
.payment-result__icon { display: grid; width: 52px; height: 52px; border-radius: 50%; place-items: center; color: #fff; background: var(--aoles-color-warning); font-size: 28px; }
.payment-result.is-success .payment-result__icon { background: var(--aoles-color-success); }
.payment-result.is-error .payment-result__icon { background: var(--aoles-color-danger); }
.payment-result h3, .payment-result p { margin: 0; }
.payment-result p { max-width: 420px; color: var(--aoles-color-text-muted); font-size: 13px; line-height: 1.6; }
.payment-result small { color: var(--aoles-color-text-muted); word-break: break-all; }
@media (max-width: 560px) { .goods-grid { grid-template-columns: 1fr; } .payment-intro { flex-direction: column; } .payment-summary { align-items: stretch; flex-direction: column; } .payment-summary .el-button { width: 100%; } }
</style>
