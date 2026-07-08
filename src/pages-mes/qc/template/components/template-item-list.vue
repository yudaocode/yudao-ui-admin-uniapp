<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle" class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        产品关联
      </view>
      <wd-button
        v-if="hasAccessByCodes(['mes:qc-template:create'])"
        size="small"
        type="primary"
        variant="plain"
        @click="handleAdd"
      >
        新增
      </wd-button>
    </view>
    <view v-if="loading" class="p-24rpx text-28rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="p-24rpx text-28rpx text-[#999]">
      暂无产品关联
    </view>
    <view v-else class="p-24rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-[#f8f9fb] p-20rpx last:mb-0"
      >
        <view class="mb-12rpx">
          <view class="truncate text-28rpx text-[#333] font-semibold">
            {{ item.itemName || '-' }}
          </view>
          <view class="mt-6rpx truncate text-24rpx text-[#999]">
            {{ item.itemCode || '-' }}
          </view>
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">规格型号：</text>{{ item.specification || '-' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">最低检测数：</text>{{ formatDisplayValue(item.quantityCheck) }} {{ item.unitMeasureName || '' }}
        </view>
        <view class="mb-8rpx text-26rpx text-[#666]">
          <text class="text-[#999]">最大不合格数：</text>{{ formatQuantityUnqualified(item.quantityUnqualified) }}
        </view>
        <view class="mb-16rpx text-26rpx text-[#666]">
          <text class="text-[#999]">缺陷率：</text>致命 {{ formatDisplayPercent(item.criticalRate) }} / 严重 {{ formatDisplayPercent(item.majorRate) }} / 轻微 {{ formatDisplayPercent(item.minorRate) }}
        </view>
        <view v-if="hasAccessByCodes(['mes:qc-template:update'])" class="flex gap-16rpx">
          <wd-button class="flex-1" size="small" variant="plain" @click="handleEdit(item)">
            编辑
          </wd-button>
          <wd-button class="flex-1" size="small" type="danger" variant="plain" @click="handleDelete(item)">
            删除
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 产品关联表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 84vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="formVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ editingId ? '编辑产品关联' : '新增产品关联' }}
          </view>
          <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="产品物料" title-width="240rpx" prop="itemId" is-link :value="itemDisplay" placeholder="请选择产品物料" @click="itemPickerRef?.open()" />
              <wd-form-item title="最低检测数" title-width="240rpx" prop="quantityCheck">
                <wd-input-number v-model="formData.quantityCheck" :min="1" :precision="0" />
              </wd-form-item>
              <wd-form-item title="最大不合格数" title-width="240rpx" prop="quantityUnqualified">
                <wd-input-number v-model="formData.quantityUnqualified" :min="0" :precision="0" />
              </wd-form-item>
              <wd-form-item title="致命缺陷率(%)" title-width="240rpx" prop="criticalRate">
                <wd-input-number v-model="formData.criticalRate" :min="0" :max="100" :precision="2" />
              </wd-form-item>
              <wd-form-item title="严重缺陷率(%)" title-width="240rpx" prop="majorRate">
                <wd-input-number v-model="formData.majorRate" :min="0" :max="100" :precision="2" />
              </wd-form-item>
              <wd-form-item title="轻微缺陷率(%)" title-width="240rpx" prop="minorRate">
                <wd-input-number v-model="formData.minorRate" :min="0" :max="100" :precision="2" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="240rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-48rpx" />
        </scroll-view>
      </view>
    </wd-popup>

    <wd-fab v-if="!showTitle && hasAccessByCodes(['mes:qc-template:create'])" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
    <ItemPicker ref="itemPickerRef" item-or-product="PRODUCT" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItem } from '@/api/mes/md/item'
import type { QcTemplateItem } from '@/api/mes/qc/template/item'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  createTemplateItem,
  deleteTemplateItem,
  getTemplateItem,
  getTemplateItemPage,
  updateTemplateItem,
} from '@/api/mes/qc/template/item'
import ItemPicker from '@/pages-mes/md/item/components/item-picker.vue'
import { useAccess } from '@/hooks/useAccess'
import { formatDisplayPercent, formatDisplayValue } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'

const props = withDefaults(defineProps<{
  templateId: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<QcTemplateItem[]>([]) // 产品关联
const loading = ref(false) // 列表加载状态
const formVisible = ref(false) // 表单弹层状态
const formLoading = ref(false) // 表单提交状态
const editingId = ref<number>() // 当前编辑编号
const formRef = ref<FormInstance>() // 表单组件引用
const itemPickerRef = ref<InstanceType<typeof ItemPicker>>() // 物料选择器
const selectedItem = ref<MdItem>() // 当前选择物料
const formData = ref<QcTemplateItem>({
  templateId: props.templateId,
  quantityCheck: 1,
  quantityUnqualified: 0,
  criticalRate: 0,
  majorRate: 0,
  minorRate: 100,
}) // 表单数据

const formSchema = createFormSchema({
  itemId: [{ required: true, message: '产品物料不能为空' }],
  quantityCheck: [{ required: true, message: '最低检测数不能为空' }],
})

const itemDisplay = computed(() => {
  return selectedItem.value
    ? `${selectedItem.value.name}（${selectedItem.value.code}）`
    : formData.value.itemName
      ? `${formData.value.itemName}（${formData.value.itemCode || '-'}）`
      : ''
})

/** 加载产品关联 */
async function loadList() {
  if (!props.templateId) {
    return
  }
  loading.value = true
  try {
    const data = await getTemplateItemPage({
      pageNo: 1,
      pageSize: 100,
      templateId: props.templateId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  editingId.value = undefined
  selectedItem.value = undefined
  formData.value = {
    templateId: props.templateId,
    quantityCheck: 1,
    quantityUnqualified: 0,
    criticalRate: 0,
    majorRate: 0,
    minorRate: 100,
  }
}

/** 新增产品关联 */
function handleAdd() {
  resetForm()
  formVisible.value = true
}

/** 编辑产品关联 */
async function handleEdit(item: QcTemplateItem) {
  resetForm()
  formVisible.value = true
  const data = await getTemplateItem(item.id)
  editingId.value = data.id
  formData.value = { ...data }
}

/** 选择产品物料 */
function handleItemConfirm(items: MdItem[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.value.itemId = item.id
  formData.value.itemCode = item.code
  formData.value.itemName = item.name
  formData.value.specification = item.specification
  formData.value.unitMeasureName = item.unitMeasureName
}

/** 构造提交数据 */
function buildSubmitData(): QcTemplateItem {
  return {
    ...formData.value,
    templateId: props.templateId,
  }
}

/** 提交产品关联 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (editingId.value) {
      await updateTemplateItem(data)
      toast.success('修改成功')
    } else {
      await createTemplateItem(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    loadList()
  } finally {
    formLoading.value = false
  }
}

/** 删除产品关联 */
async function handleDelete(item: QcTemplateItem) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除产品关联「${item.itemName || item.itemCode || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteTemplateItem(item.id)
  toast.success('删除成功')
  loadList()
}

/** 格式化最大不合格数 */
function formatQuantityUnqualified(value?: number) {
  if (value === 0) {
    return '不启用'
  }
  return formatDisplayValue(value)
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:qc:template:reload', loadList)
  loadList()
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:qc:template:reload', loadList)
})
</script>
