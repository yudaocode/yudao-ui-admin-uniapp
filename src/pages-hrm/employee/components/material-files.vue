<template>
  <view class="p-24rpx pb-32rpx">
    <view v-for="group in fileGroups" :key="group.label" class="mb-24rpx">
      <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
        {{ group.label }}
      </view>
      <view
        v-for="option in group.options"
        :key="option.value"
        class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        @click="openFileDialog(option)"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <text class="min-w-0 flex-1 text-28rpx text-[#666]">
            {{ option.label }}
          </text>
          <text class="shrink-0 text-26rpx text-[#999]">
            {{ getUrls(option.value).length }}
          </text>
        </view>
        <view v-if="!getUrls(option.value).length" class="text-26rpx text-[#999]">
          {{ canUpdate ? '点击管理附件' : '暂无附件' }}
        </view>
        <view
          v-for="(url, index) in getUrls(option.value)"
          :key="`${url}-${index}`"
          class="mb-8rpx flex items-center justify-between gap-16rpx"
          @click.stop="openAttachment(url)"
        >
          <text class="min-w-0 flex-1 truncate text-26rpx text-[#333]">
            {{ getFileNameFromUrl(url) || `附件 ${index + 1}` }}
          </text>
          <text class="shrink-0 text-26rpx text-[#1677ff]">
            查看
          </text>
        </view>
      </view>
    </view>

    <!-- 材料附件编辑弹窗 -->
    <wd-popup
      v-model="dialogVisible"
      position="bottom"
      closable
      safe-area-inset-bottom
      @close="dialogVisible = false"
    >
      <view class="px-32rpx pb-32rpx pt-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ dialogTitle }}
        </view>
        <yd-upload-file
          v-model="dialogFileUrls"
          :disabled="!canUpdate"
          :limit="20"
          :file-size="20"
        />
        <view v-if="canUpdate" class="mt-32rpx">
          <wd-button type="primary" block :loading="saving" @click="saveFiles">
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeFile } from '@/api/hrm/employee/file'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getEmployeeFileList, saveEmployeeFiles } from '@/api/hrm/employee/file'
import { useAccess } from '@/hooks/useAccess'
import { getFileNameFromUrl, openAttachment } from '@/utils/download'
import { HrmEmployeeFileGroups } from '@/pages-hrm/utils/constants'

const props = defineProps<{
  employeeId: number
}>()

const emit = defineEmits<{
  success: []
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const list = ref<EmployeeFile[]>([])
const fileGroups = HrmEmployeeFileGroups
const canUpdate = computed(() => hasAccessByCodes(['hrm:employee:update']))
const dialogVisible = ref(false)
const dialogTitle = ref('')
const selectedType = ref<number>()
const dialogFileUrls = ref<string[]>([])
const saving = ref(false)

const urlsByType = computed(() => {
  const map = new Map<number, string[]>()
  list.value.forEach((item) => {
    const urls = map.get(item.type) || []
    urls.push(item.url)
    map.set(item.type, urls)
  })
  return map
})

/** 获取指定类型附件 */
function getUrls(type: number) {
  return urlsByType.value.get(type) || []
}

/** 加载材料附件 */
async function getList() {
  if (!props.employeeId) {
    list.value = []
    return
  }
  list.value = await getEmployeeFileList(props.employeeId)
}

/** 打开附件管理 */
function openFileDialog(option: { label: string, value: number }) {
  selectedType.value = option.value
  dialogTitle.value = option.label
  dialogFileUrls.value = [...getUrls(option.value)]
  dialogVisible.value = true
}

/** 保存材料附件 */
async function saveFiles() {
  if (selectedType.value === undefined) {
    return
  }
  saving.value = true
  try {
    await saveEmployeeFiles({
      employeeId: props.employeeId,
      type: selectedType.value,
      fileUrls: dialogFileUrls.value,
    })
    toast.success('保存成功')
    dialogVisible.value = false
    await getList()
    emit('success')
  } finally {
    saving.value = false
  }
}

watch(() => props.employeeId, () => getList())
onMounted(() => getList())
defineExpose({ getList })
</script>
