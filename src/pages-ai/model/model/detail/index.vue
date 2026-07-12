<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="模型详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="模型名字" :value="formData?.name || '-'" />
        <wd-cell title="模型标识" :value="formData?.model || '-'" />
        <wd-cell title="模型平台">
          <dict-tag v-if="formData?.platform" :type="DICT_TYPE.AI_PLATFORM" :value="formData.platform" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="模型类型">
          <dict-tag :type="DICT_TYPE.AI_MODEL_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="API 密钥编号" :value="formData?.keyId ?? '-'" />
        <wd-cell title="排序" :value="formData?.sort ?? '-'" />
        <template v-if="formData?.type === AiModelTypeEnum.CHAT">
          <wd-cell title="温度参数" :value="formData.temperature ?? '-'" />
          <wd-cell title="Token 数" :value="formData.maxTokens ?? '-'" />
          <wd-cell title="上下文数量" :value="formData.maxContexts ?? '-'" />
        </template>
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['ai:model:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['ai:model:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AiModel } from '@/api/ai/model/model'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteModel, getModel } from '@/api/ai/model/model'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AiModelTypeEnum, DICT_TYPE } from '@/utils/constants'
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
const formData = ref<AiModel>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/model/index')
}

/** 加载模型详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getModel(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑模型 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-ai/model/model/form/index?id=${props.id}`,
  })
}

/** 删除模型 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除模型【${formData.value?.name || '-'}】吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteModel(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:model:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('ai:model:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('ai:model:reload', getDetail)
})
</script>
