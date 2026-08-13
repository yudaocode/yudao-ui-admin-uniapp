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
      <!-- 会计期间 -->
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          会计期间
        </view>
        <view class="yd-search-form-date-range-container">
          <view class="flex-1" @click="openMonthPicker(0)">
            <view class="yd-search-form-date-range-picker">
              {{ formData.startMonth || '开始月份' }}
            </view>
          </view>
          -
          <view class="flex-1" @click="openMonthPicker(1)">
            <view class="yd-search-form-date-range-picker">
              {{ formData.endMonth || '结束月份' }}
            </view>
          </view>
        </view>
        <wd-datetime-picker-view
          v-if="monthPickerVisible[0]"
          v-model="monthPickerValue[0]"
          type="year-month"
          :min-date="minDate"
          :max-date="maxDate"
        />
        <view v-if="monthPickerVisible[0]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="monthPickerVisible[0] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleMonthConfirm(0)">
            确定
          </wd-button>
        </view>
        <wd-datetime-picker-view
          v-if="monthPickerVisible[1]"
          v-model="monthPickerValue[1]"
          type="year-month"
          :min-date="minDate"
          :max-date="maxDate"
        />
        <view v-if="monthPickerVisible[1]" class="yd-search-form-date-range-actions">
          <wd-button size="small" variant="plain" @click="monthPickerVisible[1] = false">
            取消
          </wd-button>
          <wd-button size="small" type="primary" @click="handleMonthConfirm(1)">
            确定
          </wd-button>
        </view>
      </view>

      <!-- 科目 -->
      <yd-search-picker
        v-if="showSubject"
        v-model="formData.subjectId"
        label="科目"
        :columns="subjectColumns"
        :all-option="subjectAllOption"
        all-label="全部科目"
        placeholder="请选择科目"
        filterable
      />

      <!-- 起止科目与级次 -->
      <template v-if="showSubjectRange">
        <yd-search-picker
          v-model="formData.startSubjectId"
          label="起始科目"
          :columns="rangeSubjectColumns"
          all-option
          all-label="不限"
          filterable
        />
        <yd-search-picker
          v-model="formData.endSubjectId"
          label="结束科目"
          :columns="rangeSubjectColumns"
          all-option
          all-label="不限"
          filterable
        />
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            科目级次
          </view>
          <view class="flex items-center gap-12rpx">
            <wd-input
              v-model.number="formData.minLevel"
              class="flex-1"
              type="number"
              placeholder="最小级次"
              clearable
            />
            <text class="text-28rpx text-[#999]">至</text>
            <wd-input
              v-model.number="formData.maxLevel"
              class="flex-1"
              type="number"
              placeholder="最大级次"
              clearable
            />
          </view>
        </view>
      </template>

      <!-- 辅助核算 -->
      <template v-if="showAuxiliary">
        <yd-search-picker
          v-model="formData.auxiliaryTypeId"
          label="辅助类别"
          :columns="auxiliaryTypeColumns"
          placeholder="请选择辅助类别"
          filterable
        />
        <yd-search-picker
          v-model="formData.auxiliaryItemId"
          label="辅助项目"
          :columns="auxiliaryItemColumns"
          :all-option="auxiliaryItemAll"
          all-label="全部项目"
          placeholder="请选择辅助项目"
          filterable
        />
      </template>

      <!-- 操作按钮 -->
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
import type { AuxiliaryItem } from '@/api/fms/config/auxiliary/item'
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import type { Subject } from '@/api/fms/config/subject'
import { getAuxiliaryItemSimpleList } from '@/api/fms/config/auxiliary/item'
import { getAuxiliaryTypeSimpleList } from '@/api/fms/config/auxiliary/type'
import { getSubjectList } from '@/api/fms/config/subject'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsMonth, formatFmsPeriodLabel, formatFmsStartTime, parseFmsMonth } from '@/pages-fms/utils/format'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

/** 科目选项 */
export interface LedgerSubjectOption {
  label: string
  value: number
}

const props = withDefaults(defineProps<{
  showSubject?: boolean // 是否展示单科目筛选
  subjectOptions?: LedgerSubjectOption[] // 单科目候选，由父页面按账簿类型加载；传入后账套切换由父页面重建组件
  subjectAllOption?: boolean // 单科目是否允许「全部科目」
  showSubjectRange?: boolean // 是否展示起止科目与科目级次
  showAuxiliary?: boolean // 是否展示辅助核算类别与项目
  auxiliaryItemAll?: boolean // 辅助项目是否允许「全部项目」
  defaultMinLevel?: number // 默认最小科目级次
  defaultMaxLevel?: number // 默认最大科目级次
  initialSubjectId?: number // 初始科目编号（下钻进入时传入）
  initialStartMonth?: string // 初始开始期间（下钻进入时传入）
  initialEndMonth?: string // 初始结束期间（下钻进入时传入）
  searchPlaceholder?: string // 搜索框默认占位
}>(), {
  showSubject: false,
  subjectOptions: undefined,
  subjectAllOption: false,
  showSubjectRange: false,
  showAuxiliary: false,
  auxiliaryItemAll: false,
  defaultMinLevel: 1,
  defaultMaxLevel: 1,
  initialSubjectId: undefined,
  initialStartMonth: undefined,
  initialEndMonth: undefined,
  searchPlaceholder: '搜索账簿',
})

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: [data: Record<string, any>]
}>()

const fmsStore = useFmsStore()
const visible = ref(false) // 搜索弹窗显示状态
const initializing = ref(true) // 是否正在初始化，期间不响应辅助类别联动
const subjects = ref<Subject[]>([]) // 自行加载的科目列表（未传入 subjectOptions 时用于起止科目与可选科目）
const auxiliaryTypes = ref<AuxiliaryType[]>([]) // 辅助核算类别选项来源
const auxiliaryItems = ref<AuxiliaryItem[]>([]) // 辅助核算项目选项来源
const monthPickerVisible = ref<[boolean, boolean]>([false, false]) // 期间选择器状态
const monthPickerValue = ref<[number, number]>([Date.now(), Date.now()]) // 期间选择器临时值
const formData = reactive({
  startMonth: '',
  endMonth: '',
  subjectId: undefined as number | undefined,
  startSubjectId: undefined as number | undefined,
  endSubjectId: undefined as number | undefined,
  minLevel: 1,
  maxLevel: 1,
  auxiliaryTypeId: undefined as number | undefined,
  auxiliaryItemId: undefined as number | undefined,
}) // 搜索表单数据

const accountSetId = computed(() => fmsStore.accountSet?.id) // 当前账套编号
const minMonth = computed(() => { // 账套启用月份，可选期间的最早月份
  const accountSet = fmsStore.accountSetList.find(item => item.id === accountSetId.value)
  return formatFmsStartTime(accountSet?.startTime)
})
const maxMonth = computed(() => fmsStore.currentMonth || '') // 账套当前月份，可选期间的最晚月份
const minDate = computed(() => parseFmsMonth(minMonth.value) || undefined) // 期间选择器最早日期
const maxDate = computed(() => parseFmsMonth(maxMonth.value) || undefined) // 期间选择器最晚日期

const parentIdSet = computed(() => new Set(subjects.value.map(item => item.parentId))) // 存在子级的科目编号集合
const subjectColumns = computed(() => { // 单科目选项：优先外部候选，否则取自行加载的末级科目
  if (props.subjectOptions) {
    return props.subjectOptions
  }
  return subjects.value
    .filter(item => !parentIdSet.value.has(item.id!))
    .map(item => ({ label: `${item.code} ${item.name}`, value: item.id! }))
})
const rangeSubjectColumns = computed(() => // 起止科目选项：不限级次，按编码排序
  [...subjects.value]
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(item => ({ label: `${item.code} ${item.name}`, value: item.id! })),
)
const auxiliaryTypeColumns = computed(() =>
  auxiliaryTypes.value.map(item => ({ label: item.name, value: item.id! })),
) // 辅助类别选项
const auxiliaryItemColumns = computed(() =>
  auxiliaryItems.value.map(item => ({ label: `${item.code} ${item.name}`, value: item.id! })),
) // 辅助项目选项

const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.startMonth && formData.endMonth) {
    conditions.push(formatFmsPeriodLabel(formData.startMonth, formData.endMonth))
  }
  if (props.showSubject && formData.subjectId !== undefined) {
    const label = subjectColumns.value.find(item => item.value === formData.subjectId)?.label
    if (label) {
      conditions.push(label)
    }
  }
  if (props.showAuxiliary && formData.auxiliaryTypeId !== undefined) {
    conditions.push(auxiliaryTypes.value.find(item => item.id === formData.auxiliaryTypeId)?.name || '辅助类别已选')
  }
  if (props.showAuxiliary && formData.auxiliaryItemId !== undefined) {
    const label = auxiliaryItemColumns.value.find(item => item.value === formData.auxiliaryItemId)?.label
    if (label) {
      conditions.push(label)
    }
  }
  return conditions.length > 0 ? conditions.join(' | ') : props.searchPlaceholder
})

/** 打开期间选择器：临时值定位到当前已选月份 */
function openMonthPicker(index: 0 | 1) {
  const month = index === 0 ? formData.startMonth : formData.endMonth
  monthPickerValue.value[index] = parseFmsMonth(month) || Date.now()
  monthPickerVisible.value[index] = true
}

/** 期间选择确认：保持开始期间不晚于结束期间 */
function handleMonthConfirm(index: 0 | 1) {
  const month = formatFmsMonth(monthPickerValue.value[index])
  monthPickerVisible.value[index] = false
  if (!month) {
    return
  }
  if (index === 0) {
    formData.startMonth = month
    if (formData.endMonth && formData.endMonth < month) {
      formData.endMonth = month
    }
  } else {
    formData.endMonth = month
    if (formData.startMonth && formData.startMonth > month) {
      formData.startMonth = month
    }
  }
}

/** 加载科目列表 */
async function loadSubjects() {
  if (props.subjectOptions || !accountSetId.value) {
    return
  }
  subjects.value = await getSubjectList(accountSetId.value)
}

/** 加载辅助核算项目，并按账簿类型恢复默认选中 */
async function loadAuxiliaryItems() {
  if (!accountSetId.value || !formData.auxiliaryTypeId) {
    auxiliaryItems.value = []
    formData.auxiliaryItemId = undefined
    return
  }
  auxiliaryItems.value = await getAuxiliaryItemSimpleList(accountSetId.value, formData.auxiliaryTypeId)
  formData.auxiliaryItemId = props.auxiliaryItemAll ? undefined : auxiliaryItems.value[0]?.id
}

/** 构造查询载荷，辅助类别与项目附带展示名称供页面标题使用 */
function buildData() {
  const auxiliaryType = auxiliaryTypes.value.find(item => item.id === formData.auxiliaryTypeId)
  const auxiliaryItem = auxiliaryItems.value.find(item => item.id === formData.auxiliaryItemId)
  return {
    startMonth: formData.startMonth || undefined,
    endMonth: formData.endMonth || undefined,
    subjectId: formData.subjectId,
    startSubjectId: formData.startSubjectId,
    endSubjectId: formData.endSubjectId,
    minLevel: formData.minLevel,
    maxLevel: formData.maxLevel,
    auxiliaryTypeId: formData.auxiliaryTypeId,
    auxiliaryTypeName: auxiliaryType?.name,
    auxiliaryItemId: formData.auxiliaryItemId,
    auxiliaryItemCode: auxiliaryItem?.code,
    auxiliaryItemName: auxiliaryItem?.name,
  }
}

/** 恢复默认查询条件 */
async function resetFormData() {
  formData.startMonth = props.initialStartMonth || fmsStore.currentMonth || ''
  formData.endMonth = props.initialEndMonth || fmsStore.currentMonth || ''
  formData.subjectId = props.initialSubjectId
  formData.startSubjectId = undefined
  formData.endSubjectId = undefined
  formData.minLevel = props.defaultMinLevel
  formData.maxLevel = props.defaultMaxLevel
  if (props.showAuxiliary) {
    formData.auxiliaryTypeId = auxiliaryTypes.value[0]?.id
    await loadAuxiliaryItems()
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  // 级次范围输入颠倒时自动交换，避免后端收到非法区间
  if (formData.minLevel !== undefined && formData.maxLevel !== undefined && formData.minLevel > formData.maxLevel) {
    [formData.minLevel, formData.maxLevel] = [formData.maxLevel, formData.minLevel]
  }
  visible.value = false
  emit('search', buildData())
}

/** 重置按钮操作 */
async function handleReset() {
  await resetFormData()
  visible.value = false
  emit('reset', buildData())
}

/** 初始化：加载选项并恢复默认期间，随后触发首次查询 */
async function initialize() {
  const initializingAccountSetId = accountSetId.value
  if (!initializingAccountSetId) {
    return
  }
  initializing.value = true
  try {
    if (!fmsStore.currentMonth) {
      await fmsStore.loadCurrentMonth()
    }
    if (props.showAuxiliary) {
      auxiliaryTypes.value = await getAuxiliaryTypeSimpleList(initializingAccountSetId)
    }
    await Promise.all([loadSubjects(), resetFormData()])
  } finally {
    initializing.value = false
  }
  if (accountSetId.value !== initializingAccountSetId) {
    return // 初始化期间账套已切换，丢弃本次结果，由账套监听重新初始化
  }
  emit('search', buildData())
}

/** 辅助类别变化后重新加载项目 */
watch(() => formData.auxiliaryTypeId, () => {
  if (initializing.value || !props.showAuxiliary) {
    return
  }
  loadAuxiliaryItems()
})

/** 账套变化时重新初始化并触发查询；外部管理科目候选的页面由父页面重建组件 */
watch(() => fmsStore.accountSet?.id, (value, oldValue) => {
  if (!value || value === oldValue || props.subjectOptions) {
    return
  }
  subjects.value = []
  auxiliaryTypes.value = []
  auxiliaryItems.value = []
  initialize()
})

/** 初始化 */
onMounted(() => {
  initialize()
})
</script>
