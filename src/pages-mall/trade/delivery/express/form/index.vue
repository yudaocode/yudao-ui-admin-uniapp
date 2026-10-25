<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="公司编码" title-width="200rpx" prop="code">
            <wd-input v-model="formData.code" clearable placeholder="请输入公司编码" />
          </wd-form-item>
          <wd-form-item title="公司名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入公司名称" />
          </wd-form-item>
          <wd-form-item title="公司 Logo" title-width="200rpx" prop="logo">
            <yd-upload-img v-model="formData.logo" directory="mall/express" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="200rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="开启状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DeliveryExpress } from '@/api/mall/trade/delivery/express'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createDeliveryExpress,
  getDeliveryExpress,
  updateDeliveryExpress,
} from '@/api/mall/trade/delivery/express'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑快递公司' : '新增快递公司')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DeliveryExpress>({
  id: undefined,
  code: '',
  name: '',
  logo: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '公司编码不能为空' }],
  name: [{ required: true, message: '公司名称不能为空' }],
  logo: [{ required: true, message: '公司 Logo 不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '开启状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/trade/delivery/express/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDeliveryExpress(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateDeliveryExpress(data)
      toast.success('修改成功')
    } else {
      await createDeliveryExpress(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:delivery-express:reload')
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
