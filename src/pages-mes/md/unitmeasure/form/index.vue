<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="单位编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入单位编码" clearable />
          </wd-form-item>
          <wd-form-item title="单位名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入单位名称" clearable />
          </wd-form-item>
          <wd-form-item title="主单位" title-width="220rpx" prop="primaryFlag" center>
            <wd-switch v-model="formData.primaryFlag" />
          </wd-form-item>
          <template v-if="!formData.primaryFlag">
            <yd-form-picker
              v-model="formData.primaryId"
              label="所属主单位"
              label-width="220rpx"
              prop="primaryId"
              :columns="primaryUnitOptions"
              label-key="name"
              value-key="id"
              placeholder="请选择主单位"
            />
            <wd-form-item title="换算比例" title-width="220rpx" prop="changeRate" center>
              <wd-input-number
                :model-value="formData.changeRate ?? ''"
                allow-null
                :min="0.0001"
                :precision="4"
                @update:model-value="value => formData.changeRate = toFiniteNumber(value)"
              />
            </wd-form-item>
          </template>
          <wd-form-item title="状态" title-width="220rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdUnitMeasure } from '@/api/mes/md/unitmeasure'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createUnitMeasure,
  getUnitMeasure,
  getUnitMeasureSimpleList,
  updateUnitMeasure,
} from '@/api/mes/md/unitmeasure'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑计量单位' : '新增计量单位')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MdUnitMeasure>({
  id: undefined,
  code: '',
  name: '',
  primaryFlag: true,
  primaryId: undefined,
  changeRate: undefined,
  status: CommonStatusEnum.ENABLE,
  remark: '',
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const unitMeasureList = ref<MdUnitMeasure[]>([]) // 计量单位列表
const primaryUnitOptions = computed(() => unitMeasureList.value.filter(item => item.primaryFlag && item.id !== Number(props.id))) // 主单位选项
const formSchema = createFormSchema(() => ({
  code: [{ required: true, message: '单位编码不能为空' }],
  name: [{ required: true, message: '单位名称不能为空' }],
  primaryFlag: [{ required: true, message: '是否主单位不能为空' }],
  primaryId: [{ required: () => !formData.value.primaryFlag, message: '主单位不能为空' }],
  changeRate: [
    { required: () => !formData.value.primaryFlag, message: '换算比例不能为空' },
    { validator: value => formData.value.primaryFlag || Number(value) > 0 || '换算比例必须大于 0' },
  ],
  status: [{ required: true, message: '状态不能为空' }],
}))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/unitmeasure/index')
}

/** 加载计量单位列表 */
async function loadUnitMeasureList() {
  unitMeasureList.value = await getUnitMeasureSimpleList()
}

/** 加载计量单位详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getUnitMeasure(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  if (!formRef.value) {
    return
  }
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const data: MdUnitMeasure = {
    ...formData.value,
    primaryId: formData.value.primaryFlag ? undefined : formData.value.primaryId,
    changeRate: formData.value.primaryFlag ? undefined : formData.value.changeRate,
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateUnitMeasure(data)
      toast.success('修改成功')
    } else {
      await createUnitMeasure(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:unitmeasure:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    loadUnitMeasureList(),
    getDetail(),
  ])
})
</script>
