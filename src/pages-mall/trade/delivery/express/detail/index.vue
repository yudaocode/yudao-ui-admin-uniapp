<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="快递公司详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="公司编码" :value="formData.code || '-'" />
      <wd-cell title="公司名称" :value="formData.name || '-'" />
      <wd-cell title="公司 Logo">
        <wd-img v-if="formData.logo" :src="formData.logo" width="112rpx" height="112rpx" radius="8rpx" mode="aspectFill" enable-preview />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
      <wd-cell title="开启状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['trade:delivery:express:update', 'trade:delivery:express:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['trade:delivery:express:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['trade:delivery:express:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DeliveryExpress } from '@/api/mall/trade/delivery/express'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteDeliveryExpress, getDeliveryExpress } from '@/api/mall/trade/delivery/express'
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
const formData = ref<DeliveryExpress>({} as DeliveryExpress) // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/express/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDeliveryExpress(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/trade/delivery/express/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该快递公司吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDeliveryExpress(props.id)
    toast.success('删除成功')
    uni.$emit('mall:delivery-express:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('mall:delivery-express:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:delivery-express:reload', getDetail)
})
</script>
