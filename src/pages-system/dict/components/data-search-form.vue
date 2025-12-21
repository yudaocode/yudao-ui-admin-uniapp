<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" @close="visible = false">
    <view class="yd-search-form-container" :style="{ paddingTop: `${getNavbarHeight()}px` }">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          字典类型
        </view>
        <wd-picker
          v-model="formData.dictType"
          :columns="dictTypeOptions"
          label-key="label"
          value-key="value"
          placeholder="请选择字典类型"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          字典标签
        </view>
        <wd-input
          v-model="formData.label"
          placeholder="请输入字典标签"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" shape="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" plain @click="handleReset">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { getSimpleDictTypeList } from '@/api/system/dict/type'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getNavbarHeight } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  dictType?: string
}>()

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false)
const formData = reactive({
  dictType: undefined as string | undefined,
  label: undefined as string | undefined,
  status: -1,
})

/** 字典类型选项 */
const dictTypeOptions = ref<{ label: string, value: string }[]>([])

/** 加载字典类型列表 */
async function loadDictTypeList() {
  const list = await getSimpleDictTypeList()
  dictTypeOptions.value = list.map(item => ({
    label: item.name,
    value: item.type,
  }))
}

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.dictType) {
    const dictTypeItem = dictTypeOptions.value.find(item => item.value === formData.dictType)
    conditions.push(`类型:${dictTypeItem?.label || formData.dictType}`)
  }
  if (formData.label) {
    conditions.push(`标签:${formData.label}`)
  }
  if (formData.status !== -1) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.COMMON_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索字典数据'
})

/** 搜索 */
function handleSearch() {
  visible.value = false
  emit('search', {
    dictType: formData.dictType || undefined,
    label: formData.label || undefined,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置 */
function handleReset() {
  formData.dictType = props.dictType
  formData.label = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}

/** 监听外部 dictType 变化 */
watch(
  () => props.dictType,
  (val) => {
    formData.dictType = val
  },
  { immediate: true },
)

/** 初始化 */
onMounted(() => {
  loadDictTypeList()
})
</script>
