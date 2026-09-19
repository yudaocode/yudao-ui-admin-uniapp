<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="套红模板详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="模板名称" :value="formData?.name || '-'" />
        <wd-cell title="红头名称" :value="formData?.authorityName || '-'" />
        <wd-cell title="红头字号" :value="formData?.fontSize != null ? String(formData.fontSize) : '-'" />
        <wd-cell title="发文字号前缀" :value="formData?.noPrefix || '-'" />
        <wd-cell title="分隔线类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_OFFICIAL_DOC_SEPARATOR_TYPE" :value="formData.separatorType" />
        </wd-cell>
        <wd-cell title="状态">
          <text v-if="formData" class="text-28rpx" :class="formData.status === 0 ? 'text-[#07c160]' : 'text-[#ee0a24]'">
            {{ formData.status === 0 ? '正常' : '停用' }}
          </text>
        </wd-cell>
        <wd-cell title="显示顺序" :value="formData?.sort != null ? String(formData.sort) : '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 印章图片 -->
      <view v-if="formData?.sealPicUrl" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          印章图片
        </view>
        <wd-img :src="formData.sealPicUrl" width="200rpx" height="200rpx" radius="12rpx" mode="aspectFill" enable-preview />
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:officialdoc-template:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:officialdoc-template:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { OfficialDocTemplate } from '@/api/oa/officialdoc/template'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteOfficialDocTemplate, getOfficialDocTemplate } from '@/api/oa/officialdoc/template'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<OfficialDocTemplate>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/officialdoc/template/index')
}

/** 加载模板详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getOfficialDocTemplate(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑模板 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/officialdoc/template/form/index?id=${props.id}`,
  })
}

/** 删除模板 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该套红模板吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteOfficialDocTemplate(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:officialdoc-template:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:officialdoc-template:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:officialdoc-template:reload', getDetail)
})
</script>
