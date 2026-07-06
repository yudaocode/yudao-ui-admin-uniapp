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
          检验单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入检验单编号" clearable />
      </view>
      <yd-search-picker v-model="formData.sourceDocType" label="来源单据类型" :columns="sourceDocTypeOptions" all-option />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          来源单据编号
        </view>
        <wd-input v-model="formData.sourceDocCode" placeholder="请输入来源单据编号" clearable />
      </view>
      <ItemSearchPicker ref="itemSearchPickerRef" v-model="formData.itemId" label="产品物料" placeholder="请选择产品物料" title="选择产品物料" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
      </view>
      <yd-search-picker v-model="formData.checkResult" label="检测结果" :dict-type="DICT_TYPE.MES_QC_CHECK_RESULT" all-option />
      <view class="yd-search-form-item">
        <UserPicker v-model="formData.inspectorUserId" label="检测人员" type="radio" placeholder="请选择检测人员" />
      </view>
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
import UserPicker from '@/components/system-select/user-picker.vue'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE, MesQcSourceDocTypeEnum } from '@/utils/constants'
import ItemSearchPicker from '@/pages-mes/md/item/components/item-search-picker.vue'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const itemSearchPickerRef = ref<InstanceType<typeof ItemSearchPicker>>() // 物料搜索选择器
const formData = reactive({
  code: '',
  sourceDocType: undefined,
  sourceDocCode: '',
  itemId: undefined,
  batchCode: '',
  checkResult: undefined,
  inspectorUserId: undefined,
}) // 搜索表单数据
const sourceDocTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_QC_SOURCE_DOC_TYPE).filter(dict =>
  dict.value === MesQcSourceDocTypeEnum.RETURN_ISSUE || dict.value === MesQcSourceDocTypeEnum.RETURN_SALES,
))

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.sourceDocType != null && formData.sourceDocType !== -1) {
    conditions.push(`来源:${getDictLabel(DICT_TYPE.MES_QC_SOURCE_DOC_TYPE, formData.sourceDocType) || formData.sourceDocType}`)
  }
  if (formData.sourceDocCode) {
    conditions.push(`来源编号:${formData.sourceDocCode}`)
  }
  if (formData.itemId != null) {
    conditions.push(`物料:${itemSearchPickerRef.value?.format(formData.itemId) || formData.itemId}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次:${formData.batchCode}`)
  }
  if (formData.checkResult != null && formData.checkResult !== -1) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_QC_CHECK_RESULT, formData.checkResult) || formData.checkResult}`)
  }
  if (formData.inspectorUserId != null) {
    conditions.push(`人员:${formData.inspectorUserId}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索退料检验单（RQC）'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    code: formData.code || undefined,
    sourceDocType: formData.sourceDocType === -1 ? undefined : formData.sourceDocType,
    sourceDocCode: formData.sourceDocCode || undefined,
    itemId: formData.itemId,
    batchCode: formData.batchCode || undefined,
    checkResult: formData.checkResult === -1 ? undefined : formData.checkResult,
    inspectorUserId: formData.inspectorUserId,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.sourceDocType = undefined
  formData.sourceDocCode = ''
  formData.itemId = undefined
  formData.batchCode = ''
  formData.checkResult = undefined
  formData.inspectorUserId = undefined
  visible.value = false
  emit('reset')
}
</script>
