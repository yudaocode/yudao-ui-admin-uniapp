<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="聊天角色详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="角色头像">
          <wd-img v-if="formData?.avatar" :src="formData.avatar" width="80rpx" height="80rpx" mode="aspectFill" round enable-preview />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="角色名称" :value="formData?.name || '-'" />
        <wd-cell title="角色类别" :value="formData?.category || '-'" />
        <wd-cell title="绑定模型" :value="formData?.modelName || formData?.model || '-'" />
        <wd-cell title="角色描述" :value="formData?.description || '-'" />
        <wd-cell title="角色设定" :value="formData?.systemMessage || '-'" />
        <wd-cell title="引用知识库" :value="formatList(formData?.knowledgeIds)" />
        <wd-cell title="引用工具" :value="formatList(formData?.toolIds)" />
        <wd-cell title="引用 MCP" :value="formatList(formData?.mcpClientNames)" />
        <wd-cell title="是否公开" :value="formData?.publicStatus ? '是' : '否'" />
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['ai:chat-role:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['ai:chat-role:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ChatRoleVO } from '@/api/ai/model/chatRole'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteChatRole, getChatRole } from '@/api/ai/model/chatRole'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<ChatRoleVO>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/chatRole/index')
}

/** 加载角色详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getChatRole(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑角色 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-ai/model/chatRole/form/index?id=${props.id}`,
  })
}

/** 删除角色 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除角色【${formData.value?.name || '-'}】吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteChatRole(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:chat-role:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 格式化列表字段 */
function formatList(value?: Array<number | string>) {
  return value?.length ? value.join('、') : '-'
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:chat-role:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:chat-role:reload', getDetail)
})
</script>
