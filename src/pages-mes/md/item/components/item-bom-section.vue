<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <!-- BOM 列表 -->
      <view class="p-24rpx">
        <view v-if="loading && list.length === 0" class="flex justify-center py-100rpx">
          <wd-loading />
        </view>
        <view v-for="item in list" :key="item.id" class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-12rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
              {{ item.bomItemCode || '-' }}
            </view>
            <dict-tag
              v-if="item.itemOrProduct"
              :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT"
              :value="item.itemOrProduct"
            />
          </view>
          <view class="text-26rpx text-[#666] space-y-8rpx">
            <view>名称：{{ item.bomItemName || '-' }}</view>
            <view>规格：{{ item.bomItemSpecification || '-' }}</view>
            <view>单位：{{ item.unitMeasureName || '-' }}</view>
            <view>用量比例：{{ formatDecimalValue(item.quantity, 4, { trimTrailingZeros: true }) }}</view>
            <view v-if="item.remark">
              备注：{{ item.remark }}
            </view>
          </view>
          <view v-if="canUpdate || canDelete" class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button v-if="canUpdate" size="small" variant="plain" @click="openEdit(item)">
              编辑
            </wd-button>
            <wd-button
              v-if="canDelete"
              size="small"
              type="danger"
              variant="plain"
              :loading="deletingId === item.id"
              @click="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && list.length === 0" class="py-100rpx text-center">
          <wd-empty icon="content" tip="暂无 BOM 数据" />
        </view>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 添加按钮 -->
    <view v-if="canCreate" class="yd-detail-footer">
      <wd-button type="primary" block :loading="creating" @click="handleAdd">
        {{ creating ? '创建中...' : '添加 BOM 物料' }}
      </wd-button>
    </view>

    <!-- 编辑弹层 -->
    <wd-popup v-model="editVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="bg-white px-24rpx pb-40rpx pt-32rpx">
        <view class="mb-32rpx text-center text-32rpx text-[#333] font-semibold">
          编辑 BOM
        </view>
        <wd-cell-group border>
          <wd-cell title="BOM 物料编码" :value="editForm.bomItemCode || '-'" />
          <wd-cell title="BOM 物料名称" :value="editForm.bomItemName || '-'" />
          <wd-cell title="规格型号" :value="editForm.bomItemSpecification || '-'" />
          <wd-cell title="单位" :value="editForm.unitMeasureName || '-'" />
        </wd-cell-group>
        <view class="mt-24rpx">
          <view class="mb-16rpx text-28rpx text-[#333]">
            用量比例
          </view>
          <wd-input-number v-model="editForm.quantity" :min="0" :precision="4" :step="0.1" />
        </view>
        <view class="mt-24rpx">
          <view class="mb-16rpx text-28rpx text-[#333]">
            备注
          </view>
          <wd-textarea v-model="editForm.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
        </view>
        <view class="mt-40rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="editVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="editLoading" @click="submitEdit">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <ItemPicker
      v-if="canCreate"
      ref="itemPickerRef"
      :item-id="itemId"
      :existing-ids="existingBomItemIds"
      @confirm="handleItemConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MdItem } from '@/api/mes/md/item'
import type { MdProductBom } from '@/api/mes/md/item/productBom'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createProductBom,
  deleteProductBom,
  getProductBomListByItemId,
  updateProductBom,
} from '@/api/mes/md/item/productBom'
import { useAccess } from '@/hooks/useAccess'
import { DICT_TYPE } from '@/utils/constants'
import { formatDecimalValue } from '@/utils/format'
import ItemPicker from './item-picker.vue'

const props = defineProps<{ itemId?: number | string }>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const itemId = computed(() => getItemId() || 0) // 当前物料编号
const canCreate = computed(() => hasAccessByCodes(['mes:md-item:create']))
const canUpdate = computed(() => hasAccessByCodes(['mes:md-item:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:md-item:delete']))
const list = ref<MdProductBom[]>([]) // BOM 列表
const loading = ref(false) // 列表加载状态
const creating = ref(false) // 添加状态
const deletingId = ref<number>() // 正在删除的 BOM 编号
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择组件引用
const existingBomItemIds = computed(() => list.value.map(item => item.bomItemId).filter(Boolean)) // 已有 BOM 物料编号
const editVisible = ref(false) // 编辑弹层显示状态
const editLoading = ref(false) // 编辑提交状态
const editForm = ref<MdProductBom>({
  id: 0,
  itemId: 0,
  bomItemId: 0,
  status: undefined,
  quantity: 1,
  remark: '',
  bomItemCode: '',
  bomItemName: '',
  bomItemSpecification: '',
  unitMeasureName: '',
}) // 编辑表单数据

/** 获取物料编号 */
function getItemId() {
  const value = Number(props.itemId)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

/** 加载 BOM 列表 */
async function loadList() {
  const currentItemId = getItemId()
  if (!currentItemId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getProductBomListByItemId(currentItemId)
  } finally {
    loading.value = false
  }
}

/** 添加 */
function handleAdd() {
  if (creating.value) {
    return
  }
  itemPickerRef.value?.open()
}

/** 物料选择确认 */
async function handleItemConfirm(items: MdItem[]) {
  const currentItemId = getItemId()
  if (!currentItemId || !items.length || creating.value) {
    return
  }

  try {
    await dialog.confirm({
      title: '确认添加',
      msg: `确定将选中的 ${items.length} 个物料加入 BOM 吗？默认用量比例为 1。`,
    })
  } catch {
    return
  }

  creating.value = true
  let successCount = 0
  let failedCount = 0
  try {
    for (const item of items) {
      if (!item.id) {
        failedCount++
        continue
      }
      try {
        await createProductBom({ itemId: currentItemId, bomItemId: item.id, quantity: 1 })
        successCount++
      } catch {
        failedCount++
      }
    }
    if (successCount > 0) {
      await loadList()
    }
    if (failedCount > 0) {
      toast.warning(`添加完成：成功 ${successCount} 项，失败 ${failedCount} 项`)
    } else {
      toast.success(`成功添加 ${successCount} 项 BOM 物料`)
    }
  } finally {
    creating.value = false
  }
}

/** 打开编辑 */
function openEdit(item: MdProductBom) {
  editForm.value = {
    id: item.id,
    itemId: item.itemId,
    bomItemId: item.bomItemId,
    status: item.status,
    quantity: item.quantity,
    remark: item.remark || '',
    bomItemCode: item.bomItemCode || '',
    bomItemName: item.bomItemName || '',
    bomItemSpecification: item.bomItemSpecification || '',
    unitMeasureName: item.unitMeasureName || '',
  }
  editVisible.value = true
}

/** 提交编辑 */
async function submitEdit() {
  if (editForm.value.quantity == null) {
    toast.warning('用量比例不能为空')
    return
  }
  editLoading.value = true
  try {
    await updateProductBom({
      id: editForm.value.id,
      itemId: editForm.value.itemId,
      bomItemId: editForm.value.bomItemId,
      quantity: editForm.value.quantity,
      status: editForm.value.status,
      remark: editForm.value.remark || undefined,
    })
    editVisible.value = false
    await loadList()
    toast.success('修改成功')
  } finally {
    editLoading.value = false
  }
}

/** 删除 */
async function handleDelete(item: MdProductBom) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除 BOM 物料「${item.bomItemName || item.bomItemCode}」吗？`,
    })
  } catch {
    return
  }
  deletingId.value = item.id
  try {
    await deleteProductBom(item.id)
    await loadList()
    toast.success('删除成功')
  } finally {
    deletingId.value = undefined
  }
}

/** 监听物料编号变化 */
watch(() => props.itemId, loadList, { immediate: true })

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:md:item:reload', loadList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:md:item:reload', loadList)
})
</script>
