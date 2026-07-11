<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view v-if="loading" class="py-100rpx text-center">
        <wd-loading />
        <view class="mt-16rpx text-28rpx text-[#999]">
          加载中...
        </view>
      </view>

      <template v-else>
        <!-- 资料列表 -->
        <view class="p-24rpx">
          <view v-for="item in list" :key="item.id" class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <wd-img v-if="item.url" :src="item.url" width="100%" height="320rpx" mode="aspectFill" enable-preview />
            <view class="p-24rpx">
              <view class="mb-12rpx truncate text-30rpx text-[#333] font-semibold">
                {{ item.title || '-' }}
              </view>
              <view class="text-26rpx text-[#666] space-y-8rpx">
                <view>展示顺序：{{ item.sort ?? '-' }}</view>
                <view>所属工序：{{ getProcessLabel(item) }}</view>
                <view v-if="item.description">
                  内容说明：{{ item.description }}
                </view>
                <view v-if="item.remark">
                  备注：{{ item.remark }}
                </view>
                <view>创建时间：{{ formatDateTime(item.createTime) || '-' }}</view>
              </view>
              <view v-if="hasAccessByCodes(['mes:md-item:update', 'mes:md-item:delete'])" class="mt-16rpx flex justify-end gap-16rpx">
                <wd-button v-if="hasAccessByCodes(['mes:md-item:update'])" size="small" variant="plain" @click="openForm('update', item)">
                  编辑
                </wd-button>
                <wd-button
                  v-if="hasAccessByCodes(['mes:md-item:delete'])"
                  size="small"
                  type="danger"
                  variant="plain"
                  :loading="deletingId === item.id"
                  :disabled="deletingId !== undefined"
                  @click="handleDelete(item)"
                >
                  删除
                </wd-button>
              </view>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="list.length === 0" class="py-100rpx text-center">
            <wd-empty icon="content" :tip="`暂无 ${title} 数据`" />
          </view>
        </view>
      </template>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 添加按钮 -->
    <view v-if="hasAccessByCodes(['mes:md-item:create'])" class="yd-detail-footer">
      <wd-button type="primary" block @click="openForm('create')">
        添加 {{ title }}
      </wd-button>
    </view>

    <!-- 新增/编辑弹层 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 85vh;"
    >
      <scroll-view scroll-y class="bg-white px-24rpx pb-40rpx pt-32rpx" style="max-height: 85vh;">
        <view class="mb-32rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formType === 'create' ? `新增 ${title}` : `编辑 ${title}` }}
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="标题" title-width="180rpx" prop="title">
              <wd-input v-model="formData.title" placeholder="请输入标题" clearable />
            </wd-form-item>
            <wd-form-item title="展示顺序" title-width="180rpx" prop="sort" center>
              <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
            </wd-form-item>
            <ProcessFormPicker
              v-model="formData.processId"
              label="所属工序"
              label-width="180rpx"
              placeholder="请选择工序"
              clearable
            />
            <wd-form-item title="内容说明" title-width="180rpx" prop="description">
              <wd-textarea v-model="formData.description" placeholder="请输入详细描述" :maxlength="500" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="图片" title-width="180rpx" prop="url">
              <yd-upload-img v-model="formData.url" :directory="uploadDirectory" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="180rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="mt-40rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="formVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="submitForm">
            确定
          </wd-button>
        </view>
      </scroll-view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdProductSip } from '@/api/mes/md/item/productSip'
import type { MdProductSop } from '@/api/mes/md/item/productSop'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createProductSip,
  deleteProductSip,
  getProductSipListByItemId,
  updateProductSip,
} from '@/api/mes/md/item/productSip'
import {
  createProductSop,
  deleteProductSop,
  getProductSopListByItemId,
  updateProductSop,
} from '@/api/mes/md/item/productSop'
import { useAccess } from '@/hooks/useAccess'
import ProcessFormPicker from '@/pages-mes/pro/process/components/process-form-picker.vue'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

type PictureType = 'sip' | 'sop'
type PictureItem = MdProductSip | MdProductSop
type FormType = 'create' | 'update'

interface PictureFormData {
  id?: number
  itemId: number
  sort: number
  processId?: number | null
  title: string
  description?: string | null
  url?: string | null
  remark?: string | null
}

const props = defineProps<{
  itemId?: number | string
  type: PictureType
}>()

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<PictureItem[]>([]) // 图片资料列表
const loading = ref(false) // 列表加载状态
const deletingId = ref<number>() // 正在删除的资料编号
const title = computed(() => props.type === 'sip' ? 'SIP' : 'SOP')
const uploadDirectory = computed(() => props.type === 'sip' ? 'mes/md/product-sip' : 'mes/md/product-sop')
const formVisible = ref(false) // 表单弹层状态
const formType = ref<FormType>('create') // 表单类型
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<PictureFormData>(defaultForm()) // 表单数据
const formSchema = createFormSchema({
  title: [{ required: true, message: '标题不能为空' }],
  sort: [{ required: true, message: '展示顺序不能为空' }],
})

/** 获取物料编号 */
function getItemId() {
  const value = Number(props.itemId)
  return Number.isFinite(value) && value > 0 ? value : undefined
}

/** 默认表单数据 */
function defaultForm(): PictureFormData {
  return {
    itemId: getItemId() || 0,
    sort: 0,
    title: '',
    processId: undefined,
    description: '',
    url: '',
    remark: '',
  }
}

/** 获取工序展示文案 */
function getProcessLabel(item: PictureItem): string {
  const name = item.processName || ''
  const code = item.processCode || ''
  if (name && code) {
    return `${name} (${code})`
  }
  return name || code || '-'
}

/** 加载图片资料列表 */
async function loadList() {
  const itemId = getItemId()
  if (!itemId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = props.type === 'sip'
      ? await getProductSipListByItemId(itemId)
      : await getProductSopListByItemId(itemId)
  } finally {
    loading.value = false
  }
}

/** 打开新增/编辑弹层 */
function openForm(type: FormType, item?: PictureItem) {
  formType.value = type
  formData.value = type === 'update' && item
    ? {
        id: item.id,
        itemId: item.itemId,
        sort: item.sort,
        title: item.title,
        processId: item.processId ?? undefined,
        description: item.description || '',
        url: item.url || '',
        remark: item.remark || '',
      }
    : defaultForm()
  formVisible.value = true
}

/** 提交表单 */
async function submitForm() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (formType.value === 'update' && formData.value.id === undefined) {
    toast.warning(`缺少 ${title.value} 编号`)
    return
  }

  const isCreate = formType.value === 'create'
  const actionName = isCreate ? '新增' : '修改'
  try {
    await dialog.confirm({
      title: '提示',
      msg: isCreate ? `确认新增该 ${title.value} 吗？` : `确认保存该 ${title.value} 的修改吗？`,
    })
  } catch {
    return
  }

  formLoading.value = true
  try {
    if (props.type === 'sip') {
      if (isCreate) {
        await createProductSip(formData.value as MdProductSip)
      } else {
        await updateProductSip(formData.value as MdProductSip)
      }
    } else if (isCreate) {
      await createProductSop(formData.value as MdProductSop)
    } else {
      await updateProductSop(formData.value as MdProductSop)
    }
    formVisible.value = false
    toast.success(`${actionName}成功`)
    await loadList()
  } finally {
    formLoading.value = false
  }
}

/** 删除图片资料 */
async function handleDelete(item: PictureItem) {
  if (!item.id || deletingId.value !== undefined) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除 ${title.value}「${item.title}」吗？`,
    })
  } catch {
    return
  }
  deletingId.value = item.id
  try {
    if (props.type === 'sip') {
      await deleteProductSip(item.id)
    } else {
      await deleteProductSop(item.id)
    }
    toast.success('删除成功')
    await loadList()
  } finally {
    deletingId.value = undefined
  }
}

/** 监听物料编号变化 */
watch(
  () => [props.itemId, props.type],
  () => loadList(),
  { immediate: true },
)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:md:item:reload', loadList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:md:item:reload', loadList)
})
</script>
