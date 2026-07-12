<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="写作详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <view class="overflow-hidden rounded-16rpx bg-white shadow-sm">
          <wd-cell-group border>
            <wd-cell title="编号" :value="formData?.id || '-'" />
            <wd-cell title="用户" :value="getUserName(formData?.userId)" />
            <wd-cell title="写作类型">
              <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.AI_WRITE_TYPE" :value="formData.type" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="写作要求" :value="formData?.prompt || '-'" />
            <wd-cell v-if="formData?.originalContent" title="原文" :value="formData.originalContent" />
            <wd-cell title="长度">
              <dict-tag v-if="formData?.length != null" :type="DICT_TYPE.AI_WRITE_LENGTH" :value="formData.length" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="格式">
              <dict-tag v-if="formData?.format != null" :type="DICT_TYPE.AI_WRITE_FORMAT" :value="formData.format" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="语气">
              <dict-tag v-if="formData?.tone != null" :type="DICT_TYPE.AI_WRITE_TONE" :value="formData.tone" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="语言">
              <dict-tag v-if="formData?.language != null" :type="DICT_TYPE.AI_WRITE_LANGUAGE" :value="formData.language" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="平台">
              <dict-tag v-if="formData?.platform" :type="DICT_TYPE.AI_PLATFORM" :value="formData.platform" />
              <text v-else>-</text>
            </wd-cell>
            <wd-cell title="模型" :value="formData?.model || '-'" />
            <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
          </wd-cell-group>
        </view>

        <view class="mt-24rpx rounded-16rpx bg-white p-24rpx shadow-sm">
          <view class="mb-20rpx text-30rpx text-[#222] font-semibold">
            生成内容
          </view>
          <text v-if="formData?.generatedContent" selectable class="whitespace-pre-wrap text-28rpx text-[#333] leading-46rpx">
            {{ formData.generatedContent }}
          </text>
          <view v-else class="py-40rpx text-center text-26rpx text-[#999]">
            {{ formData?.errorMessage || '暂无生成内容' }}
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['ai:write:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AiWrite } from '@/api/ai/write'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteWrite, getWrite } from '@/api/ai/write'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<AiWrite>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/write/manager/index')
}

/** 加载写作详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getWrite(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 删除写作记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该写作记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteWrite(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:write:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 获取用户昵称 */
function getUserName(userId?: number) {
  return userList.value.find(user => user.id === userId)?.nickname || String(userId || '-')
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    getDetail(),
    getSimpleUserList().then(data => userList.value = data),
  ])
})
</script>
