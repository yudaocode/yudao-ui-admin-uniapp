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
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-cell title="字典类型" title-width="200rpx" prop="dictType" center>
            <wd-picker
              v-model="formData.dictType"
              :columns="dictTypeOptions"
              label-key="label"
              value-key="value"
              :disabled="!!formData.id"
              placeholder="请选择字典类型"
            />
          </wd-cell>
          <wd-input
            v-model="formData.label"
            label="数据标签"
            label-width="200rpx"
            prop="label"
            clearable
            placeholder="请输入数据标签"
          />
          <wd-input
            v-model="formData.value"
            label="数据键值"
            label-width="200rpx"
            prop="value"
            clearable
            placeholder="请输入数据键值"
          />
          <wd-input
            v-model.number="formData.sort"
            label="显示排序"
            label-width="200rpx"
            prop="sort"
            type="number"
            clearable
            placeholder="请输入显示排序"
          />
          <wd-cell title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" shape="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-cell title="颜色类型" title-width="200rpx" prop="colorType" center>
            <wd-picker
              v-model="formData.colorType"
              :columns="colorOptions"
              label-key="label"
              value-key="value"
              placeholder="请选择颜色类型"
            />
          </wd-cell>
          <wd-input
            v-model="formData.cssClass"
            label="CSS Class"
            label-width="200rpx"
            prop="cssClass"
            clearable
            placeholder="请输入 CSS Class，如 #108ee9"
          />
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="200rpx"
            prop="remark"
            clearable
            placeholder="请输入备注"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white p-24rpx">
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
import type { DictData } from '@/api/system/dict/data'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createDictData, getDictData, updateDictData } from '@/api/system/dict/data'
import { getSimpleDictTypeList } from '@/api/system/dict/type'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

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
const formLoading = ref(false)
const formData = ref<DictData>({
  id: undefined,
  dictType: props.dictType || '',
  label: '',
  value: '',
  sort: 0,
  status: 0,
  colorType: '',
  cssClass: '',
  remark: '',
})
const formRules = {
  dictType: [{ required: true, message: '字典类型不能为空' }],
  label: [{ required: true, message: '数据标签不能为空' }],
  value: [{ required: true, message: '数据键值不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref()

/** 字典类型选项 */
const dictTypeOptions = ref<{ label: string, value: string }[]>([])

/** 颜色类型选项 */
const colorOptions = [
  { value: '', label: '无' },
  { value: 'processing', label: '主要' },
  { value: 'success', label: '成功' },
  { value: 'default', label: '默认' },
  { value: 'warning', label: '警告' },
  { value: 'error', label: '危险' },
  { value: 'pink', label: 'pink' },
  { value: 'red', label: 'red' },
  { value: 'orange', label: 'orange' },
  { value: 'green', label: 'green' },
  { value: 'cyan', label: 'cyan' },
  { value: 'blue', label: 'blue' },
  { value: 'purple', label: 'purple' },
]

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/dict/index')
}

/** 加载字典类型列表 */
async function loadDictTypeList() {
  const list = await getSimpleDictTypeList()
  dictTypeOptions.value = list.map(item => ({
    label: item.name,
    value: item.type,
  }))
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
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadDictTypeList()
  await getDetail()
})
</script>

<style lang="scss" scoped>
</style>
