<template>
  <view class="pb-200rpx">
    <!-- 脚本状态 -->
    <wd-cell-group border>
      <wd-cell title="解析模式" value="JS 解析" />
      <wd-cell title="启用状态">
        <wd-tag :type="product.scriptEnabled ? 'success' : 'default'" variant="plain">
          {{ product.scriptEnabled ? '启用' : '停用' }}
        </wd-tag>
      </wd-cell>
      <wd-cell title="已保存内容" :value="shortHash ? `#${shortHash}` : '未配置'" />
    </wd-cell-group>

    <!-- 脚本编辑区 -->
    <view class="m-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
      <view class="mb-12rpx flex items-center justify-between gap-16rpx">
        <text class="text-28rpx text-[#333] font-semibold">脚本内容</text>
        <view v-if="dirty" class="shrink-0 rounded-6rpx bg-[#fff7e6] px-12rpx py-4rpx text-22rpx text-[#fa8c16]">
          有未保存的修改
        </view>
      </view>
      <view class="mb-16rpx text-24rpx text-[#999]">
        脚本（ES5）· UTF-8 不超过 32KB · 每次调用都重新执行顶层代码，不能保存状态
      </view>
      <view class="mb-16rpx text-24rpx text-[#999]">
        decode 返回一条标准消息 {method, params?, requestId?, code?, msg?, data?}，返回 null 表示无业务消息；上报 method 只能是 thing.property.post / thing.event.post，回执（带 code）只能是 thing.property.set / thing.service.invoke 且必须带 requestId；原始帧由平台自动附带，不能返回 raw、id、deviceId、messages、ack 等字段 · encode 返回 {bytes: [...]} 或 {standard: true}，返回 null 表示不下发
      </view>
      <view v-if="hasAccessByCodes(['iot:product:script-edit'])" class="rounded-8rpx bg-[#f7f8fa] p-8rpx">
        <wd-textarea
          v-model="draft"
          placeholder="请输入 ES5 脚本，定义 decode(ctx) / encode(ctx)"
          custom-textarea-class="!h-640rpx !font-mono !text-24rpx"
        />
      </view>
      <view v-else class="max-h-[760rpx] overflow-y-auto rounded-8rpx bg-[#f7f8fa] p-20rpx">
        <text class="whitespace-pre-wrap break-all font-mono text-24rpx text-[#333]">{{ savedContent || '未配置脚本' }}</text>
      </view>
      <view v-if="hasAccessByCodes(['iot:product:script-edit'])" class="mt-16rpx text-24rpx text-[#999]">
        保存或启停后，连接健康时通常一个刷新周期内生效；未保存的修改只保留在当前页面。
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['iot:product:script-edit'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="saving" :disabled="!dirty || toggling" @click="handleSave">
          保存并生效
        </wd-button>
        <wd-button
          class="flex-1"
          :type="product.scriptEnabled ? 'warning' : 'success'"
          :loading="toggling"
          :disabled="saving || (!product.scriptEnabled && !savedContent)"
          @click="handleToggleEnabled"
        >
          {{ product.scriptEnabled ? '停用' : '启用' }}
        </wd-button>
        <wd-button class="flex-1" type="info" :disabled="!dirty || saving" @click="handleRestore">
          恢复
        </wd-button>
        <wd-button class="flex-1" type="info" variant="plain" @click="debugVisible = true">
          调试
        </wd-button>
      </view>
    </view>

    <!-- 调试弹窗 -->
    <ScriptDebugPopup v-model="debugVisible" :product-id="product.id" :content="draft" />
  </view>
</template>

<script lang="ts" setup>
import type { Product } from '@/api/iot/product/product'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { updateProductScript } from '@/api/iot/product/product'
import { useAccess } from '@/hooks/useAccess'
import { getScriptShortHash } from '@/pages-iot/utils/raw'
import ScriptDebugPopup from './script-debug-popup.vue'

const props = defineProps<{ product: Product }>()
const emit = defineEmits<{ refresh: [] }>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const draft = ref('') // 编辑中的脚本内容，只保留在当前页面
const saving = ref(false) // 保存状态
const toggling = ref(false) // 启停状态
const debugVisible = ref(false) // 调试弹窗显示状态
const savedContent = computed(() => props.product.scriptContent || '') // 已保存的脚本内容
const dirty = computed(() => draft.value !== savedContent.value) // 是否有未保存的修改
const shortHash = computed(() => getScriptShortHash(savedContent.value)) // 已保存内容的 hash 短码

/** 已保存内容变化时，未修改的编辑区同步为最新内容 */
watch(savedContent, (value, oldValue) => {
  if (draft.value === (oldValue ?? '')) {
    draft.value = value
  }
}, { immediate: true })

/** 保存并生效：只保存内容，不改变启用状态 */
async function handleSave() {
  if (!props.product.id || saving.value) {
    return
  }
  if (!draft.value && props.product.scriptEnabled) {
    toast.warning('请先停用脚本，再清空内容')
    return
  }
  try {
    await dialog.confirm({ title: '保存并生效', msg: '保存后，连接健康时通常一个刷新周期内对该产品的全部设备生效' })
  } catch {
    return
  }
  saving.value = true
  try {
    await updateProductScript({ id: props.product.id, scriptContent: draft.value })
    toast.success('保存成功')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

/** 启用 / 停用：只改变启用状态，使用已保存的内容 */
async function handleToggleEnabled() {
  if (!props.product.id || toggling.value) {
    return
  }
  const enabled = !props.product.scriptEnabled
  const actionName = enabled ? '启用' : '停用'
  const msg = enabled && dirty.value
    ? '启用的是已保存内容，未保存的修改不会生效。连接健康时通常一个刷新周期内对该产品的全部设备生效'
    : `确定要${actionName}数据解析脚本吗？连接健康时通常一个刷新周期内对该产品的全部设备生效`
  try {
    await dialog.confirm({ title: '提示', msg })
  } catch {
    return
  }
  toggling.value = true
  try {
    await updateProductScript({ id: props.product.id, scriptEnabled: enabled })
    toast.success(`${actionName}成功`)
    emit('refresh')
  } finally {
    toggling.value = false
  }
}

/** 恢复为已保存内容 */
async function handleRestore() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定放弃未保存的修改，恢复为已保存内容吗？' })
  } catch {
    return
  }
  draft.value = savedContent.value
}
</script>
