<template>
  <!-- 账套切换条：展示当前账套与会计期间，点击弹窗切换 -->
  <view>
    <view
      class="flex items-center justify-between rounded-12rpx bg-white px-24rpx py-20rpx shadow-sm"
      @click="openSheet"
    >
      <view class="min-w-0 flex items-center gap-12rpx">
        <wd-icon name="organization" size="32rpx" color="#1677ff" />
        <text class="max-w-320rpx overflow-hidden text-ellipsis whitespace-nowrap text-28rpx text-[#333]">
          {{ fmsStore.accountSet?.companyName || '请选择账套' }}
        </text>
        <text v-if="currentMonthText" class="flex-shrink-0 text-24rpx text-[#999]">
          {{ currentMonthText }}
        </text>
      </view>
      <view class="flex flex-shrink-0 items-center gap-8rpx text-26rpx text-[#1677ff]">
        <text>切换</text>
        <wd-icon name="arrow-down" size="24rpx" color="#1677ff" />
      </view>
    </view>

    <!-- 账套选择弹窗 -->
    <wd-action-sheet
      v-model="sheetVisible"
      :actions="sheetActions"
      cancel-text="取消"
      @select="handleSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { updateAccountSetDefaultStatus } from '@/api/fms/config/account-user'
import { useFmsStore } from '@/pages-fms/store/fms'

const emit = defineEmits<{
  (e: 'change'): void
}>()

const toast = useToast()
const fmsStore = useFmsStore()

const sheetVisible = ref(false) // 账套选择弹窗是否可见
const switching = ref(false) // 是否正在切换账套

/** 当前会计期间展示文案 */
const currentMonthText = computed(() => {
  const match = fmsStore.currentMonth?.match(/^(\d{4})-(\d{2})$/)
  return match ? `${match[1]} 年第 ${match[2]} 期` : fmsStore.currentMonth || ''
})
/** 账套选项（未初始化账套不可选） */
const sheetActions = computed(() =>
  fmsStore.accountSetList.map(item => ({
    name: `${item.companyName}${item.defaultStatus ? '（默认）' : ''}${item.initialized ? '' : '（未初始化）'}`,
    id: item.id,
    disabled: !item.initialized,
  })),
)

/** 打开账套选择弹窗，并刷新账套列表 */
async function openSheet() {
  await fmsStore.loadAccountSetList(true)
  sheetVisible.value = true
}

/** 切换账套 */
async function handleSelect({ item }: { item: { id?: number, name: string } }) {
  const id = item.id
  if (!id || switching.value || id === fmsStore.accountSet?.id) {
    return
  }
  const accountSet = fmsStore.accountSetList.find(accountSetItem => accountSetItem.id === id)
  if (!accountSet?.initialized) {
    return
  }
  switching.value = true
  try {
    await updateAccountSetDefaultStatus(id)
    fmsStore.setAccountSet({
      id,
      companyName: accountSet.companyName,
      level: accountSet.level!,
    })
    await fmsStore.loadCurrentMonth()
    emit('change')
    toast.success(`已切换至账套“${accountSet.companyName}”`)
  } finally {
    switching.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!fmsStore.accountSetListLoaded) {
    await fmsStore.loadAccountSetList()
  }
  if (fmsStore.accountSet && !fmsStore.currentMonth) {
    await fmsStore.loadCurrentMonth()
  }
})
</script>
