<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="淘汰原因"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 原因列表 -->
    <view class="p-24rpx">
      <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
        加载中...
      </view>
      <view
        v-else-if="reasonList.length === 0"
        class="rounded-12rpx bg-white py-80rpx text-center text-28rpx text-[#999] shadow-sm"
      >
        暂无淘汰原因
      </view>
      <view
        v-for="(_reason, index) in reasonList"
        :key="index"
        class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-28rpx text-[#999]">序号 {{ index + 1 }}</text>
          <wd-button
            v-if="hasAccessByCodes(['hrm:recruit:config:update'])"
            size="small"
            type="danger"
            variant="text"
            @click="removeReason(index)"
          >
            删除
          </wd-button>
        </view>
        <wd-input
          v-model="reasonList[index]"
          :disabled="!hasAccessByCodes(['hrm:recruit:config:update'])"
          clearable
          placeholder="请输入淘汰原因"
          :maxlength="255"
        />
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['hrm:recruit:config:update'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" variant="plain" @click="addReason">
          新增
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="saving" @click="saveReasonList">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  getRecruitEliminateReasonList,
  saveRecruitEliminateReason,
} from '@/api/hrm/recruit/config'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const loading = ref(true) // 列表加载中
const saving = ref(false) // 保存中
const reasonList = ref<string[]>([]) // 淘汰原因列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询列表 */
async function getReasonList() {
  loading.value = true
  try {
    reasonList.value = await getRecruitEliminateReasonList()
  } finally {
    loading.value = false
  }
}

/** 添加按钮操作 */
function addReason() {
  if (reasonList.value.some(reason => !reason.trim())) {
    toast.warning('请先填写新增的淘汰原因')
    return
  }
  reasonList.value.push('')
}

/** 删除按钮操作 */
function removeReason(index: number) {
  reasonList.value.splice(index, 1)
}

/** 保存按钮操作 */
async function saveReasonList() {
  const reasons = reasonList.value.map(reason => reason.trim())
  if (reasons.some(reason => !reason)) {
    toast.warning('淘汰原因不能为空')
    return
  }
  if (new Set(reasons).size !== reasons.length) {
    toast.warning('淘汰原因不能重复')
    return
  }

  saving.value = true
  try {
    await saveRecruitEliminateReason(reasons)
    toast.success('修改成功')
    await getReasonList()
  } finally {
    saving.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getReasonList()
})
</script>
