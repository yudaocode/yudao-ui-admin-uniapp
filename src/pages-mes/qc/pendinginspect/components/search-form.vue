<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据编号
        </view>
        <wd-input
          v-model="formData.sourceDocCode"
          placeholder="请输入来源单据编号"
          clearable
        />
      </view>
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品物料" placeholder="请选择产品物料" title="选择产品物料" />
      <yd-search-picker v-model="formData.qcType" label="检验类型" :dict-type="DICT_TYPE.MES_QC_TYPE" all-option />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'

const props = defineProps<{
  initialQuery?: {
    sourceDocCode?: string
    qcType?: number
    itemId?: number
  }
}>()

const emit = defineEmits<{
  search: [data: {
    sourceDocCode?: string
    qcType?: number
    itemId?: number
  }]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  sourceDocCode: props.initialQuery?.sourceDocCode,
  itemId: props.initialQuery?.itemId,
  qcType: props.initialQuery?.qcType,
}) // 搜索表单数据
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.sourceDocCode !== undefined && formData.sourceDocCode !== '') {
    conditions.push(`来源单据编号:${formData.sourceDocCode}`)
  }
  if (formData.itemId !== undefined) {
    conditions.push(`产品物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.qcType !== undefined) {
    conditions.push(`检验类型:${getDictLabel(DICT_TYPE.MES_QC_TYPE, formData.qcType) || formData.qcType}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索待检任务'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    sourceDocCode: formData.sourceDocCode || undefined,
    qcType: formData.qcType,
    itemId: formData.itemId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.sourceDocCode = undefined
  formData.itemId = undefined
  formData.qcType = undefined
  visible.value = false
  emit('reset')
}
</script>
