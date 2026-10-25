<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="分销用户详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="用户编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="用户昵称" :value="formData.nickname || '-'" />
      <wd-cell title="头像">
        <wd-img v-if="formData.avatar" :src="formData.avatar" width="88rpx" height="88rpx" mode="aspectFill" round enable-preview />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="上级推广员编号" :value="formData.bindUserId != null ? String(formData.bindUserId) : '-'" />
      <wd-cell title="绑定时间" :value="formatDateTime(formData.bindUserTime) || '-'" />
      <wd-cell title="成为推广员时间" :value="formatDateTime(formData.brokerageTime) || '-'" />
      <wd-cell title="推广资格" :value="formData.brokerageEnabled ? '是' : '否'" />
      <wd-cell title="推广人数" :value="formData.brokerageUserCount != null ? String(formData.brokerageUserCount) : '-'" />
      <wd-cell title="推广订单数量" :value="formData.brokerageOrderCount != null ? String(formData.brokerageOrderCount) : '-'" />
      <wd-cell title="推广订单金额" :value="formatDisplayMoney(formData.brokerageOrderPrice)" />
      <wd-cell title="已提现金额" :value="formatDisplayMoney(formData.withdrawPrice)" />
      <wd-cell title="已提现次数" :value="formData.withdrawCount != null ? String(formData.withdrawCount) : '-'" />
      <wd-cell title="可用佣金" :value="formatDisplayMoney(formData.price)" />
      <wd-cell title="冻结佣金" :value="formatDisplayMoney(formData.frozenPrice)" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['trade:brokerage-user:update-bind-user', 'trade:brokerage-user:clear-bind-user', 'trade:brokerage-user:update-brokerage-enable'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['trade:brokerage-user:update-bind-user'])" class="flex-1" type="primary" @click="handleOpenBind">
          修改推广员
        </wd-button>
        <wd-button v-if="formData.bindUserId && hasAccessByCodes(['trade:brokerage-user:clear-bind-user'])" class="flex-1" type="warning" :loading="submitting" @click="handleClearBind">
          清除推广员
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['trade:brokerage-user:update-brokerage-enable'])" class="flex-1" type="info" :loading="submitting" @click="handleToggleEnabled">
          {{ formData.brokerageEnabled ? '取消资格' : '开通资格' }}
        </wd-button>
      </view>
    </view>

    <!-- 修改推广员弹窗 -->
    <wd-popup
      v-model="bindVisible"
      position="bottom"
      closable
      custom-style="border-radius: 24rpx 24rpx 0 0;"
      @close="bindVisible = false"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx text-32rpx text-[#333] font-semibold">
          修改推广员
        </view>
        <wd-input v-model="bindUserId" type="number" clearable placeholder="请输入推广员编号" />
        <wd-button class="mt-16rpx" size="small" variant="plain" :loading="bindSearching" @click="handleSearchBindUser">
          查询推广员
        </wd-button>
        <view v-if="bindUser && bindUser.id === parseId(bindUserId)" class="mt-16rpx text-28rpx text-[#666]">
          推广员：{{ bindUser.nickname || '-' }}（{{ bindUser.id }}）
        </view>
        <view class="mt-24rpx flex gap-20rpx">
          <wd-button class="flex-1" variant="plain" @click="bindVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="submitting" @click="handleUpdateBind">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { TradeBrokerageUser } from '@/api/mall/trade/brokerage/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  clearTradeBrokerageUserBind,
  getTradeBrokerageUser,
  updateTradeBrokerageUser,
  updateTradeBrokerageUserEnabled,
} from '@/api/mall/trade/brokerage/user'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayMoney } from '@/utils/format'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<TradeBrokerageUser>({}) // 详情数据
const submitting = ref(false) // 操作提交状态
const bindUser = ref<TradeBrokerageUser>() // 已查询确认的推广员
const bindSearching = ref(false) // 推广员查询状态
const bindVisible = ref(false) // 修改推广员弹窗
const bindUserId = ref<number | string>('') // 推广员编号输入

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/brokerage/user/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getTradeBrokerageUser(props.id)
    bindUserId.value = formData.value.bindUserId ?? ''
  } finally {
    toast.close()
  }
}

/** 打开修改推广员弹窗 */
function handleOpenBind() {
  bindUser.value = undefined
  bindVisible.value = true
}

/** 查询推广员 */
async function handleSearchBindUser() {
  bindUser.value = undefined
  const id = parseId(bindUserId.value)
  if (!id) {
    toast.warning('请输入推广员编号')
    return
  }
  if (id === parseId(props.id)) {
    toast.warning('不能绑定自己为推广人')
    return
  }
  bindSearching.value = true
  try {
    bindUser.value = await getTradeBrokerageUser(id)
    if (!bindUser.value?.id)
      toast.warning('推广员不存在')
  } finally {
    bindSearching.value = false
  }
}

/** 修改推广员 */
async function handleUpdateBind() {
  if (!bindUserId.value) {
    toast.warning('请输入推广员编号')
    return
  }
  if (parseId(bindUserId.value) === parseId(props.id)) {
    toast.warning('不能绑定自己为推广人')
    return
  }
  if (!bindUser.value?.id || bindUser.value.id !== parseId(bindUserId.value)) {
    toast.warning('请先查询并确认推广人')
    return
  }
  submitting.value = true
  try {
    await updateTradeBrokerageUser({ id: props.id, bindUserId: bindUserId.value })
    toast.success('修改成功')
    bindVisible.value = false
    uni.$emit('mall:brokerage-user:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 清除推广员 */
async function handleClearBind() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要清除该用户的推广员吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await clearTradeBrokerageUserBind(props.id)
    toast.success('清除成功')
    uni.$emit('mall:brokerage-user:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 修改推广资格 */
async function handleToggleEnabled() {
  const enabled = !formData.value.brokerageEnabled
  try {
    await dialog.confirm({ title: '提示', msg: `确定要${enabled ? '开通' : '取消'}该用户的推广资格吗？` })
  } catch {
    return
  }
  submitting.value = true
  try {
    await updateTradeBrokerageUserEnabled({ id: props.id, enabled })
    toast.success('修改成功')
    uni.$emit('mall:brokerage-user:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
