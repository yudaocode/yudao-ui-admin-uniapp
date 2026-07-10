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
          <DictTypeFormPicker v-model="formData.dictType" prop="dictType" :disabled="Boolean(formData.id)" />
          <wd-form-item title="数据标签" title-width="200rpx" prop="label">
            <wd-input
              v-model="formData.label"
              clearable
              placeholder="请输入数据标签"
            />
          </wd-form-item>
          <wd-form-item title="数据键值" title-width="200rpx" prop="value">
            <wd-input
              v-model="formData.value"
              clearable
              placeholder="请输入数据键值"
            />
          </wd-form-item>
          <wd-form-item title="显示排序" title-width="200rpx" prop="sort" center>
            <wd-input-number
              v-model="formData.sort"
              :min="0"
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
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
          <yd-form-picker
            v-model="formData.colorType"
            label="颜色类型"
            prop="colorType"
            :dict-type="DICT_TYPE.SYSTEM_DICT_COLOR_TYPE"
            dict-kind="str"
            placeholder="请选择颜色类型"
          />
          <wd-form-item title="CSS Class" title-width="200rpx" prop="cssClass">
            <wd-input
              v-model="formData.cssClass"
              clearable
              placeholder="请输入 CSS Class，如 #108ee9"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              placeholder="请输入备注"
            />
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
import type { DictData } from '@/api/system/dict/data'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDictData, getDictData, updateDictData } from '@/api/system/dict/data'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import DictTypeFormPicker from '../../type/components/dict-type-form-picker.vue'

const props = defineProps<{
  id?: number | any
  dictType?: string | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑字典数据' : '新增字典数据')
const formLoading = ref(false) // 表单提交状态
const formData = ref<DictData>({
  id: undefined,
  dictType: props.dictType || '',
  label: '',
  value: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  colorType: '',
  cssClass: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  dictType: [{ required: true, message: '字典类型不能为空' }],
  label: [{ required: true, message: '数据标签不能为空' }],
  value: [{ required: true, message: '数据键值不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/dict/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getDictData(props.id)
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
      await updateDictData(formData.value)
      toast.success('修改成功')
    } else {
      await createDictData(formData.value)
      toast.success('新增成功')
    }
    uni.$emit('system:dict-data:reload')
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
