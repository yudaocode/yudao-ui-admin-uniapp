<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 78vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 头部 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="!selectedBom" @click="handleConfirm">
          确定
        </wd-button>
      </view>

      <!-- 列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
        <view v-if="loading" class="p-24rpx text-28rpx text-[#999]">
          加载中...
        </view>
        <view v-else-if="list.length === 0" class="p-24rpx text-28rpx text-[#999]">
          当前产品暂无可添加 BOM 物料
        </view>
        <view v-else class="p-24rpx">
          <view
            v-for="bom in list"
            :key="bom.id || bom.bomItemId"
            class="mb-20rpx rounded-12rpx bg-white p-20rpx shadow-sm last:mb-0"
            :class="selectedBom?.bomItemId === bom.bomItemId ? 'ring-2 ring-[#1677ff]' : ''"
            @click="selectedBom = bom"
          >
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-28rpx text-[#333] font-semibold">
                  {{ bom.bomItemName || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ bom.bomItemCode || '-' }}
                </view>
              </view>
              <dict-tag v-if="bom.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="bom.itemOrProduct" />
            </view>
            <view class="text-24rpx text-[#666] space-y-6rpx">
              <view>规格型号：{{ bom.bomItemSpecification || '-' }}</view>
              <view>单位：{{ bom.unitMeasureName || '-' }}</view>
              <view>默认用量：{{ bom.quantity ?? '-' }}</view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { MdProductBom } from '@/api/mes/md/item/productBom'
import { ref } from 'vue'
import { getProductBomListByItemId } from '@/api/mes/md/item/productBom'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  itemId?: number
  existingIds?: number[]
  title?: string
}>(), {
  itemId: undefined,
  existingIds: () => [],
  title: '选择 BOM 物料',
})

const emit = defineEmits<{
  confirm: [bom: MdProductBom]
}>()

const visible = ref(false) // 弹窗显示状态
const loading = ref(false) // 列表加载状态
const list = ref<MdProductBom[]>([]) // 可选 BOM 物料
const selectedBom = ref<MdProductBom>() // 当前选择 BOM

/** 打开选择器 */
async function open(selectedBomItemId?: number) {
  if (!props.itemId) {
    return
  }
  visible.value = true
  selectedBom.value = undefined
  loading.value = true
  try {
    const data = await getProductBomListByItemId(props.itemId)
    list.value = (data || []).filter((item) => {
      return item.bomItemId === selectedBomItemId || !props.existingIds.includes(item.bomItemId)
    })
    selectedBom.value = list.value.find(item => item.bomItemId === selectedBomItemId)
  } finally {
    loading.value = false
  }
}

/** 取消选择 */
function handleCancel() {
  visible.value = false
}

/** 确认选择 */
function handleConfirm() {
  if (!selectedBom.value) {
    return
  }
  emit('confirm', selectedBom.value)
  visible.value = false
}

defineExpose({ open })
</script>
