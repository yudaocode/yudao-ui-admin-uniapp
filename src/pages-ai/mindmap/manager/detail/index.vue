<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="导图详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id || '-'" />
        <wd-cell title="用户" :value="getUserName(formData?.userId)" />
        <wd-cell title="提示词" :value="formData?.prompt || '-'" />
        <wd-cell title="平台">
          <dict-tag v-if="formData?.platform" :type="DICT_TYPE.AI_PLATFORM" :value="formData.platform" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="模型" :value="formData?.model || '-'" />
        <wd-cell title="生成内容" :value="formData?.generatedContent || '-'" />
        <wd-cell title="错误信息" :value="formData?.errorMessage || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['ai:mind-map:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { MindMapVO } from '@/api/ai/mindmap'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteMindMap, getMindMap } from '@/api/ai/mindmap'
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
const formData = ref<MindMapVO>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/mindmap/manager/index')
}

/** 加载导图详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMindMap(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 删除导图记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该导图记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMindMap(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:mind-map:reload')
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
