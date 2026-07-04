<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="仓库名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入仓库名称" clearable />
          </wd-form-item>
          <wd-form-item title="仓库地址" title-width="220rpx" prop="address">
            <wd-input v-model="formData.address" placeholder="请输入仓库地址" clearable />
          </wd-form-item>
          <wd-form-item title="仓库状态" title-width="220rpx" prop="status" center>
            <wd-switch v-model="formData.status" :active-value="CommonStatusEnum.ENABLE" :inactive-value="CommonStatusEnum.DISABLE" />
          </wd-form-item>
          <wd-form-item title="仓储费" title-width="220rpx" prop="warehousePrice" center>
            <wd-input-number v-model="formData.warehousePrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="搬运费" title-width="220rpx" prop="truckagePrice" center>
            <wd-input-number v-model="formData.truckagePrice" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="负责人" title-width="220rpx" prop="principal">
            <wd-input v-model="formData.principal" placeholder="请输入负责人" clearable />
          </wd-form-item>
          <wd-form-item title="排序" title-width="220rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Warehouse } from '@/api/erp/stock/warehouse'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createWarehouse, getWarehouse, updateWarehouse } from '@/api/erp/stock/warehouse'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑仓库' : '新增仓库')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Warehouse>({
  id: undefined,
  name: '',
  address: '',
  sort: 0,
  remark: '',
  principal: '',
  warehousePrice: undefined,
  truckagePrice: undefined,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const formSchema = createFormSchema({
  name: [{ required: true, message: '仓库名称不能为空' }],
  status: [{ required: true, message: '仓库状态不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-erp/stock/warehouse/index')
}

/** 加载仓库详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getWarehouse(props.id)
  } finally {
    toast.close()
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateWarehouse(formData.value)
      toast.success('修改成功')
    } else {
      await createWarehouse(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('erp:warehouse:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
