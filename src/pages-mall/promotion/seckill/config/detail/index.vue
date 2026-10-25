<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="秒杀时段详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="时段名称" :value="formData.name || '-'" />
      <wd-cell title="开始时间" :value="formData.startTime || '-'" />
      <wd-cell title="结束时间" :value="formData.endTime || '-'" />
      <wd-cell title="轮播图">
        <view v-if="formData.sliderPicUrls?.length" class="flex flex-wrap gap-12rpx">
          <wd-img
            v-for="(pic, index) in formData.sliderPicUrls"
            :key="index"
            :src="pic"
            width="112rpx"
            height="112rpx"
            radius="8rpx"
            mode="aspectFill"
            enable-preview
          />
        </view>
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="开启状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:seckill-config:update', 'promotion:seckill-config:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:seckill-config:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:seckill-config:update'])" class="flex-1" type="info" :loading="submitting" @click="handleToggle">
          {{ formData.status === CommonStatusEnum.ENABLE ? '禁用' : '启用' }}
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:seckill-config:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionSeckillConfig } from '@/api/mall/promotion/seckill'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import {
  deletePromotionSeckillConfig,
  getPromotionSeckillConfig,
  updatePromotionSeckillConfigStatus,
} from '@/api/mall/promotion/seckill'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
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
const formData = ref<PromotionSeckillConfig>({}) // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 状态切换提交状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/seckill/config/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionSeckillConfig(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/seckill/config/form/index?id=${props.id}` })
}

/** 切换状态 */
async function handleToggle() {
  const status = formData.value.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  try {
    await dialog.confirm({ title: '提示', msg: '确定要切换该秒杀时段状态吗？' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await updatePromotionSeckillConfigStatus({ id: props.id, status })
    toast.success('切换成功')
    uni.$emit('mall:promotion-seckill-config:reload')
    await getDetail()
  } finally {
    submitting.value = false
  }
}

/** 删除 */
async function handleDelete() {
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该秒杀时段吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionSeckillConfig(props.id)
    toast.success('删除成功')
    uni.$emit('mall:promotion-seckill-config:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
