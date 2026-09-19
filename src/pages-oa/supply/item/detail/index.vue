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

    <!-- 入库弹窗 -->
    <wd-popup
      v-model="stockInVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="p-24rpx">
        <view class="mb-24rpx flex items-center justify-between">
          <text class="text-32rpx text-[#333] font-semibold">入库 - {{ formData?.name || '' }}</text>
          <wd-icon name="close" size="32rpx" color="#999" @click="stockInVisible = false" />
        </view>
        <view class="mb-16rpx text-26rpx text-[#999]">
          当前库存：{{ formData?.stockQuantity ?? 0 }}{{ formData?.unit || '' }}
        </view>
        <wd-form ref="stockFormRef" :model="stockFormData" :schema="stockFormSchema">
          <wd-cell-group border>
            <wd-form-item title="入库数量" title-width="180rpx" prop="quantity">
              <wd-input-number
                v-model="stockFormData.quantity"
                :min="1"
                :precision="0"
                placeholder="请输入入库数量"
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <wd-button
          class="mt-24rpx"
          type="primary"
          block
          :loading="stockInLoading"
          @click="handleStockInSubmit"
        >
          确认入库
        </wd-button>
      </view>
    </wd-popup>

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
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { SupplyItem } from '@/api/oa/supply-item'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteSupplyItem, getSupplyItem, stockInSupplyItem } from '@/api/oa/supply-item'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

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
const stockInLoading = ref(false) // 入库提交状态
const stockFormData = ref({ quantity: undefined as number | undefined }) // 入库表单数据
const stockFormSchema = createFormSchema({ // 入库表单校验规则
  quantity: [{ required: true, message: '入库数量不能为空' }],
})
const stockFormRef = ref<FormInstance>() // 入库表单组件引用

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
  stockFormData.value = { quantity: undefined }
  stockInVisible.value = true
}

/** 提交入库 */
async function handleStockInSubmit() {
  if (!props.id) {
    return
  }
  const { valid } = await stockFormRef.value.validate()
  if (!valid) {
    return
  }
  stockInLoading.value = true
  try {
    await stockInSupplyItem({
      id: Number(props.id),
      quantity: Number(stockFormData.value.quantity),
    })
    toast.success('入库成功')
    stockInVisible.value = false
    uni.$emit('oa:supply-item:reload')
    getDetail()
  } finally {
    stockInLoading.value = false
  }
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
