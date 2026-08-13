<template>
  <view class="w-full">
    <view
      v-for="(entry, index) in items"
      :key="index"
      class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
    >
      <!-- 分录标题与删除 -->
      <view class="mb-20rpx flex items-center justify-between gap-16rpx">
        <text class="text-28rpx text-[#333] font-semibold">分录 {{ index + 1 }}</text>
        <wd-button
          v-if="!disabled && items.length > 1"
          size="small"
          type="danger"
          variant="plain"
          @click="handleRemove(index)"
        >
          删除
        </wd-button>
      </view>

      <!-- 摘要 -->
      <view class="mb-20rpx flex items-center gap-12rpx">
        <wd-input
          v-model="entry.digest"
          label="摘要"
          label-width="80rpx"
          placeholder="请输入摘要"
          clearable
          :disabled="disabled"
          class="min-w-0 flex-1"
        />
        <wd-button v-if="!disabled" size="small" type="primary" variant="plain" @click="openDigestLibrary(index)">
          摘要库
        </wd-button>
      </view>

      <!-- 会计科目 -->
      <SubjectFormPicker
        v-model="entry.subjectId"
        label="科目"
        label-width="80rpx"
        :account-set-id="accountSetId"
        :subjects="subjects"
        :disabled="disabled"
        @confirm="subject => handleSubjectConfirm(entry, subject)"
      />

      <!-- 辅助核算 -->
      <view
        v-for="(auxiliaryTypeId, auxiliaryIndex) in getSubjectAuxiliaryTypeIds(entry)"
        :key="auxiliaryTypeId"
        class="mt-20rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx"
        @click="handleOpenAuxiliary(index, auxiliaryTypeId, auxiliaryIndex)"
      >
        <text class="text-26rpx text-[#666]">{{ getAuxiliaryTypeName(entry, auxiliaryIndex) }}</text>
        <view class="flex items-center gap-8rpx">
          <text class="text-26rpx" :class="getEntryAuxiliary(entry, auxiliaryTypeId)?.name ? 'text-[#333]' : 'text-[#999]'">
            {{ getEntryAuxiliary(entry, auxiliaryTypeId)?.name || '请选择' }}
          </text>
          <wd-icon v-if="!disabled" name="arrow-right" size="12px" color="#999" />
        </view>
      </view>

      <!-- 借方金额 -->
      <view class="mt-20rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
        <text class="text-26rpx text-[#666]">借方金额</text>
        <wd-input-number
          v-model="entry.debitAmount"
          allow-null
          :precision="2"
          :disabled="disabled"
          @change="handleAmountChange(entry, 'debit')"
        />
      </view>

      <!-- 贷方金额 -->
      <view class="mt-20rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx">
        <text class="text-26rpx text-[#666]">贷方金额</text>
        <wd-input-number
          v-model="entry.creditAmount"
          allow-null
          :precision="2"
          :disabled="disabled"
          @change="handleAmountChange(entry, 'credit')"
        />
      </view>
    </view>

    <!-- 添加分录 -->
    <wd-button v-if="!disabled" block variant="plain" type="primary" @click="handleAdd">
      添加分录
    </wd-button>

    <!-- 摘要库 -->
    <wd-popup
      v-model="digestVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="digestVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            常用摘要
          </view>
          <view class="w-96rpx" />
        </view>
        <view class="bg-white px-24rpx pb-20rpx">
          <wd-input v-model="digestKeyword" placeholder="搜索摘要" clearable />
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1">
          <view class="p-24rpx">
            <view
              v-for="digest in filteredDigestList"
              :key="digest.id"
              class="mb-20rpx rounded-12rpx bg-white p-24rpx text-28rpx text-[#333] shadow-sm"
              @click="handleDigestSelect(digest)"
            >
              {{ digest.content }}
            </view>
            <view v-if="filteredDigestList.length === 0" class="py-100rpx text-center">
              <wd-empty icon="content" tip="暂无常用摘要" />
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 辅助核算项目选择器 -->
    <AuxiliaryPicker ref="auxiliaryPickerRef" :account-set-id="accountSetId" @confirm="handleAuxiliaryConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { Digest } from '@/api/fms/config/digest'
import type { Subject } from '@/api/fms/config/subject'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getDigestSimpleList } from '@/api/fms/config/digest'
import SubjectFormPicker from '@/pages-fms/config/subject/components/subject-form-picker.vue'
import { FmsSubjectStatus } from '@/pages-fms/utils/constants'
import AuxiliaryPicker from './auxiliary-picker.vue'

/** 凭证分录编辑状态 */
interface EntryFormItem {
  id?: number // 分录编号
  digest: string // 摘要内容
  subjectId?: number // 科目编号
  quantity?: number // 数量（无录入 UI，编辑时原样透传，避免覆盖已有数量核算数据）
  unitPrice?: number // 单价（同数量，仅透传）
  debitAmount?: number // 借方金额
  creditAmount?: number // 贷方金额
  auxiliaries: { typeId: number, itemId?: number, name?: string }[] // 辅助核算项目
}

const props = defineProps<{
  accountSetId?: number
  disabled?: boolean
  modelValue?: EntryFormItem[]
  subjects?: Subject[] // 平铺科目列表，用于辅助核算配置与末级校验
}>()

const emit = defineEmits<{
  'update:modelValue': [value: EntryFormItem[]]
}>()

const toast = useToast()
const items = ref<EntryFormItem[]>([]) // 分录列表
const digestVisible = ref(false) // 摘要库显示状态
const digestKeyword = ref('') // 摘要搜索关键词
const digestList = ref<Digest[]>([]) // 常用摘要列表
const digestEntryIndex = ref<number>() // 当前摘要分录索引
const auxiliaryPickerRef = ref<InstanceType<typeof AuxiliaryPicker>>() // 辅助核算选择器
const currentAuxiliary = ref<{ entryIndex: number, typeId: number }>() // 当前编辑的辅助核算
const subjectMap = computed(() => new Map((props.subjects || []).map(item => [item.id!, item]))) // 科目 Map
const parentIdSet = computed(() => new Set((props.subjects || []).map(item => item.parentId))) // 存在子级的科目编号集合
const filteredDigestList = computed(() => { // 过滤后的常用摘要
  const keyword = digestKeyword.value.trim()
  return keyword ? digestList.value.filter(item => item.content.includes(keyword)) : digestList.value
})

/** 创建空白分录 */
function createEmptyEntry(): EntryFormItem {
  return { digest: '', auxiliaries: [] }
}

/** 获取科目 */
function getSubject(subjectId?: number) {
  return subjectId ? subjectMap.value.get(subjectId) : undefined
}

/** 获取分录科目的辅助核算类别编号数组 */
function getSubjectAuxiliaryTypeIds(entry: EntryFormItem) {
  return getSubject(entry.subjectId)?.auxiliaryTypeIds || []
}

/** 获取辅助核算类别名称（科目返回的类别名称与编号数组按顺序对齐） */
function getAuxiliaryTypeName(entry: EntryFormItem, auxiliaryIndex: number) {
  return getSubject(entry.subjectId)?.auxiliaryTypeNames?.[auxiliaryIndex] || '辅助核算'
}

/** 获取分录辅助核算项目 */
function getEntryAuxiliary(entry: EntryFormItem, typeId: number) {
  return entry.auxiliaries.find(item => item.typeId === typeId)
}

/** 添加分录 */
function handleAdd() {
  items.value.push(createEmptyEntry())
}

/** 删除分录 */
function handleRemove(index: number) {
  items.value.splice(index, 1)
}

/** 科目选择确认后重建辅助核算项目，保留已有同类别的选择 */
function handleSubjectConfirm(entry: EntryFormItem, subject?: Subject) {
  entry.auxiliaries = (subject?.auxiliaryTypeIds || []).map((typeId) => {
    const current = entry.auxiliaries.find(item => item.typeId === typeId)
    return current || { typeId }
  })
}

/** 处理借贷金额互斥 */
function handleAmountChange(entry: EntryFormItem, direction: 'debit' | 'credit') {
  if (direction === 'debit' && entry.debitAmount != null) {
    entry.creditAmount = undefined
  } else if (direction === 'credit' && entry.creditAmount != null) {
    entry.debitAmount = undefined
  }
}

/** 打开摘要库 */
async function openDigestLibrary(index: number) {
  digestEntryIndex.value = index
  digestKeyword.value = ''
  digestVisible.value = true
  if (digestList.value.length === 0 && props.accountSetId) {
    digestList.value = await getDigestSimpleList(props.accountSetId)
  }
}

/** 选择常用摘要 */
function handleDigestSelect(digest: Digest) {
  if (digestEntryIndex.value !== undefined) {
    items.value[digestEntryIndex.value].digest = digest.content
  }
  digestEntryIndex.value = undefined
  digestVisible.value = false
}

/** 打开辅助核算选择器 */
function handleOpenAuxiliary(entryIndex: number, typeId: number, auxiliaryIndex: number) {
  if (props.disabled) {
    return
  }
  currentAuxiliary.value = { entryIndex, typeId }
  auxiliaryPickerRef.value?.open(typeId, getAuxiliaryTypeName(items.value[entryIndex], auxiliaryIndex))
}

/** 辅助核算选择确认 */
function handleAuxiliaryConfirm({ typeId, item }: { typeId: number, item: { id?: number, name: string } }) {
  const context = currentAuxiliary.value
  if (!context || context.typeId !== typeId) {
    return
  }
  const entry = items.value[context.entryIndex]
  const auxiliary = getEntryAuxiliary(entry, typeId)
  if (auxiliary) {
    auxiliary.itemId = item.id
    auxiliary.name = item.name
  } else {
    entry.auxiliaries.push({ typeId, itemId: item.id, name: item.name })
  }
  currentAuxiliary.value = undefined
}

/** 判断分录是否完全空白 */
function isEntryEmpty(entry: EntryFormItem) {
  return !(
    entry.digest?.trim()
    || entry.subjectId
    || entry.debitAmount
    || entry.creditAmount
    || entry.auxiliaries.some(item => item.itemId)
  )
}

/** 校验分录 */
function validate() {
  const filledEntries = items.value.filter(entry => !isEntryEmpty(entry))
  if (filledEntries.length < 2) {
    toast.warning('凭证至少需要两条有效分录')
    return false
  }
  // 摘要为空时沿用上一条分录
  filledEntries.forEach((entry, index) => {
    if (index > 0 && !entry.digest?.trim()) {
      entry.digest = filledEntries[index - 1].digest
    }
  })
  for (const entry of filledEntries) {
    if (!entry.digest?.trim()) {
      toast.warning('请填写每条分录的摘要')
      return false
    }
    const subject = getSubject(entry.subjectId)
    if (!subject) {
      toast.warning('请选择每条分录的会计科目')
      return false
    }
    if (parentIdSet.value.has(subject.id!) || subject.status !== FmsSubjectStatus.ENABLED) {
      toast.warning(`会计科目“${subject.name}”已停用或不是末级科目，请重新选择`)
      return false
    }
    const debitAmount = Number(entry.debitAmount || 0)
    const creditAmount = Number(entry.creditAmount || 0)
    if (debitAmount !== 0 && creditAmount !== 0) {
      toast.warning('同一条分录不能同时填写借方和贷方金额')
      return false
    }
    if (debitAmount === 0 && creditAmount === 0) {
      toast.warning('请填写每条分录的借方或贷方金额')
      return false
    }
    if (getSubjectAuxiliaryTypeIds(entry).some(typeId => !getEntryAuxiliary(entry, typeId)?.itemId)) {
      toast.warning(`请完整选择“${subject.name}”的辅助核算项目`)
      return false
    }
  }
  return true
}

/** 同步外部分录 */
watch(() => props.modelValue, (value) => {
  items.value = Array.isArray(value) ? value : []
}, { immediate: true })

/** 分录变更后回写表单 */
watch(items, (value) => {
  emit('update:modelValue', value)
}, { deep: true })

defineExpose({ validate })
</script>
