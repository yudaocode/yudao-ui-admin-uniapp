<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="Banner 详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="标题" :value="formData.title || '-'" />
      <wd-cell title="图片">
        <wd-img v-if="formData.picUrl" :src="formData.picUrl" width="112rpx" height="112rpx" radius="8rpx" mode="aspectFill" enable-preview />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="跳转地址" :value="formData.url || '-'" />
      <wd-cell title="位置">
        <dict-tag v-if="formData.position != null" :type="DICT_TYPE.PROMOTION_BANNER_POSITION" :value="formData.position" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
      <wd-cell title="状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="描述" :value="formData.memo || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:banner:update', 'promotion:banner:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:banner:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:banner:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionBanner } from '@/api/mall/promotion/banner'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deletePromotionBanner, getPromotionBanner } from '@/api/mall/promotion/banner'
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
const dialog = useDialog()
const toast = useToast()
const formData = ref<PromotionBanner>({} as PromotionBanner) // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/banner/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionBanner(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/banner/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该 Banner 吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionBanner(props.id)
    toast.success('删除成功')
    uni.$emit('mall:promotion-banner:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:promotion-banner:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-banner:reload', getDetail)
})
</script>
