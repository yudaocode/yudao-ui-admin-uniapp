<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 顶部操作 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <view class="w-96rpx" />
        <view class="text-32rpx text-[#333] font-semibold">
          凭证模板分类
        </view>
        <wd-button variant="plain" size="small" @click="visible = false">
          关闭
        </wd-button>
      </view>

      <!-- 新增/编辑表单 -->
      <view class="flex items-center gap-16rpx bg-white px-24rpx pb-20rpx">
        <wd-input
          v-model="formData.name"
          class="min-w-0 flex-1"
          placeholder="请输入分类名称"
          :maxlength="255"
          clearable
        />
        <wd-button
          v-if="canSave"
          type="primary"
          size="small"
          :loading="submitting"
          @click="handleSave"
        >
          {{ formData.id ? '保存' : '新增' }}
        </wd-button>
        <wd-button v-if="formData.id" size="small" variant="plain" @click="resetForm">
          取消
        </wd-button>
      </view>

      <!-- 分类列表 -->
      <scroll-view scroll-y class="min-h-0 flex-1">
        <view class="p-24rpx">
          <view
            v-for="item in list"
            :key="item.id"
            class="mb-20rpx flex items-center justify-between gap-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <text class="min-w-0 flex-1 truncate text-28rpx text-[#333]">{{ item.name }}</text>
            <view class="flex flex-shrink-0 gap-16rpx">
              <wd-button
                v-if="fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:voucher-template-category:update'])"
                size="small"
                type="primary"
                variant="plain"
                @click="handleEdit(item)"
              >
                编辑
              </wd-button>
              <wd-button
                v-if="fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:voucher-template-category:delete'])"
                size="small"
                type="danger"
                variant="plain"
                @click="handleDelete(item)"
              >
                删除
              </wd-button>
            </view>
          </view>

          <!-- 空状态 -->
          <view v-if="list.length === 0" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无凭证模板分类" />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { VoucherTemplateCategory } from '@/api/fms/config/voucher-template-category'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createVoucherTemplateCategory,
  deleteVoucherTemplateCategory,
  getVoucherTemplateCategoryList,
  updateVoucherTemplateCategory,
} from '@/api/fms/config/voucher-template-category'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'

const props = defineProps<{
  accountSetId?: number
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const fmsStore = useFmsStore()
const visible = ref(false) // 弹窗显示状态
const submitting = ref(false) // 表单提交状态
const list = ref<VoucherTemplateCategory[]>([]) // 分类列表
const formData = reactive({ // 分类表单数据
  id: undefined as number | undefined,
  name: '',
})

/** 账套可写且有对应权限时才允许新增或保存分类 */
const canSave = computed(() =>
  fmsStore.isAccountSetWritable
  && hasAccessByCodes([formData.id ? 'fms:config:voucher-template-category:update' : 'fms:config:voucher-template-category:create']),
)

/** 打开弹窗 */
async function open() {
  resetForm()
  visible.value = true
  await getList()
}

/** 查询分类列表 */
async function getList() {
  if (!props.accountSetId) {
    list.value = []
    return
  }
  list.value = await getVoucherTemplateCategoryList(props.accountSetId)
}

/** 编辑分类 */
function handleEdit(item: VoucherTemplateCategory) {
  formData.id = item.id
  formData.name = item.name
}

/** 重置表单 */
function resetForm() {
  formData.id = undefined
  formData.name = ''
}

/** 新增或保存分类 */
async function handleSave() {
  const accountSetId = props.accountSetId
  const name = formData.name.trim()
  if (!accountSetId) {
    return
  }
  if (!name) {
    toast.warning('请输入分类名称')
    return
  }
  submitting.value = true
  try {
    if (formData.id) {
      await updateVoucherTemplateCategory({ id: formData.id, accountSetId, name })
      toast.success('修改成功')
    } else {
      await createVoucherTemplateCategory({ accountSetId, name })
      toast.success('新增成功')
    }
    resetForm()
    await getList()
    emit('change')
  } finally {
    submitting.value = false
  }
}

/** 删除分类 */
async function handleDelete(item: VoucherTemplateCategory) {
  const accountSetId = props.accountSetId
  if (!accountSetId || !item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `是否确认删除凭证模板分类“${item.name}”？`,
    })
  } catch {
    return
  }
  await deleteVoucherTemplateCategory(accountSetId, item.id)
  toast.success('删除成功')
  if (formData.id === item.id) {
    resetForm()
  }
  await getList()
  emit('change')
}

defineExpose({ open })
</script>
