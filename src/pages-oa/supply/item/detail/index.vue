<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="用品详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="物品名称" :value="formData?.name || '-'" />
        <wd-cell title="物品编码" :value="formData?.no || '-'" />
        <wd-cell title="类别">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SUPPLY_CATEGORY" :value="formData.category" />
        </wd-cell>
        <wd-cell title="管理类型">
          <dict-tag v-if="formData" :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="formData.manageType" />
        </wd-cell>
        <wd-cell title="规格型号" :value="formData?.model || '-'" />
        <wd-cell title="计量单位" :value="formData?.unit || '-'" />
        <wd-cell title="参考单价（元）" :value="formData?.referencePrice != null ? String(formData.referencePrice) : '-'" />
        <wd-cell title="库存数量" :value="formData?.stockQuantity != null ? String(formData.stockQuantity) : '-'" />
        <wd-cell title="最低库存预警" :value="formData?.minStockQuantity != null ? String(formData.minStockQuantity) : '-'" />
        <wd-cell title="状态">
          <text v-if="formData" class="text-28rpx" :class="formData.status === 0 ? 'text-[#07c160]' : 'text-[#ee0a24]'">
            {{ formData.status === 0 ? '正常' : '停用' }}
          </text>
        </wd-cell>
        <wd-cell title="排序" :value="formData?.sort != null ? String(formData.sort) : '-'" />
        <wd-cell title="所属部门" :value="formData?.deptName || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 物品图片 -->
      <view v-if="formData?.picUrl" class="mt-20rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
          物品图片
        </view>
        <wd-img :src="formData.picUrl" width="200rpx" height="200rpx" radius="12rpx" mode="aspectFill" enable-preview />
      </view>
    </view>

    <StockForm
      :id="Number(props.id)"
      ref="stockFormRef"
      v-model="stockInVisible"
      :item-name="formData?.name"
      :stock-quantity="formData?.stockQuantity"
      :unit="formData?.unit"
      @success="handleStockInSuccess"
    />

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['oa:supply-item:stock-in'])"
          class="flex-1" type="primary" @click="handleStockIn"
        >
          入库
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:supply-item:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['oa:supply-item:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SupplyItem } from '@/api/oa/supply/item'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteSupplyItem, getSupplyItem } from '@/api/oa/supply/item'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import StockForm from '../components/stock-form.vue'
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
const formData = ref<SupplyItem>() // 详情数据
const deleting = ref(false) // 删除状态
const stockInVisible = ref(false) // 入库弹窗显示状态
const stockFormRef = ref<InstanceType<typeof StockForm>>() // 入库表单引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/supply/item/index')
}

/** 加载用品详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getSupplyItem(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 编辑用品 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/supply/item/form/index?id=${props.id}`,
  })
}

/** 打开入库弹窗 */
function handleStockIn() {
  stockFormRef.value?.reset()
  stockInVisible.value = true
}

/** 入库成功后刷新详情 */
function handleStockInSuccess() {
  uni.$emit('oa:supply-item:reload')
  getDetail()
}

/** 删除用品 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该办公用品吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSupplyItem(Number(props.id))
    toast.success('删除成功')
    uni.$emit('oa:supply-item:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:supply-item:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:supply-item:reload', getDetail)
})
</script>
