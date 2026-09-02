<template>
  <!-- 标签管理弹窗 -->
  <wd-popup v-model="visible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
    <view class="flex flex-col" :style="{ maxHeight: '80vh' }">
      <view class="flex items-center justify-between p-32rpx pb-16rpx">
        <text class="text-32rpx text-[#333] font-semibold">工作项标签管理</text>
        <wd-button size="small" type="primary" variant="plain" @click="handleAdd">
          新增标签
        </wd-button>
      </view>
      <scroll-view scroll-y class="min-h-0 flex-1 px-32rpx">
        <wd-empty v-if="!list.length" description="暂无标签" />
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-20rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-20rpx"
        >
          <wd-tag :custom-style="getColorTagStyle(item.color)">
            {{ item.name }}
          </wd-tag>
          <view class="flex gap-16rpx">
            <wd-button size="small" variant="plain" @click="handleEdit(item)">
              编辑
            </wd-button>
            <wd-button size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
      </scroll-view>
      <view class="p-32rpx pt-16rpx">
        <wd-button block variant="plain" @click="visible = false">
          关闭
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <!-- 标签表单弹窗 -->
  <wd-popup v-model="formVisible" position="center" root-portal custom-style="width: 640rpx; border-radius: 16rpx;">
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ formData.id ? '编辑标签' : '新增标签' }}
      </view>
      <wd-cell-group border>
        <wd-cell title="标签名称" title-width="180rpx">
          <wd-input v-model.trim="formData.name" placeholder="请输入标签名称" :maxlength="50" />
        </wd-cell>
      </wd-cell-group>
      <view class="mt-24rpx">
        <view class="mb-16rpx text-28rpx text-[#666]">
          标签颜色
        </view>
        <view class="mb-16rpx flex flex-wrap gap-16rpx">
          <view
            v-for="color in colorPresets"
            :key="color"
            class="h-56rpx w-56rpx rounded-8rpx"
            :style="{ backgroundColor: color, border: formData.color === color ? '4rpx solid #333' : '4rpx solid transparent' }"
            @click="formData.color = color"
          />
        </view>
        <wd-input v-model.trim="formData.color" placeholder="自定义颜色，如 #409EFF" />
      </view>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="formVisible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <view v-if="$slots.default" @click="open">
    <slot />
  </view>
</template>

<script lang="ts" setup>
import type { WorkItemLabel } from '@/api/pms/pm/workitem/label'
import {
  createWorkItemLabel,
  deleteWorkItemLabel,
  getWorkItemLabelList,
  updateWorkItemLabel,
} from '@/api/pms/pm/workitem/label'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getColorTagStyle } from '@/utils/format'

const emit = defineEmits<{ success: [] }>() // 标签变化事件，供调用方刷新选项

const toast = useToast()
const dialog = useDialog()
const visible = ref(false) // 管理弹窗显示状态
const formVisible = ref(false) // 标签表单弹窗显示状态
const formLoading = ref(false) // 表单提交中
const list = ref<WorkItemLabel[]>([]) // 标签列表
const formData = ref<Partial<WorkItemLabel>>({ name: '', color: '#409EFF' }) // 标签表单数据

const colorPresets = [ // 预设标签颜色
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#722ED1',
  '#13C2C2',
  '#EB2F96',
  '#FA8C16',
  '#1677FF',
]

/** 打开管理弹窗 */
function open() {
  visible.value = true
  getList()
}

/** 查询标签列表 */
async function getList() {
  list.value = await getWorkItemLabelList()
}

/** 新增标签 */
function handleAdd() {
  formData.value = { name: '', color: '#409EFF' }
  formVisible.value = true
}

/** 编辑标签 */
function handleEdit(item: WorkItemLabel) {
  formData.value = { id: item.id, name: item.name, color: item.color }
  formVisible.value = true
}

/** 提交标签表单 */
async function handleSubmit() {
  if (!formData.value.name?.trim()) {
    toast.warning('请输入标签名称')
    return
  }
  if (!formData.value.color?.trim()) {
    toast.warning('请选择标签颜色')
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateWorkItemLabel({ id: formData.value.id, name: formData.value.name, color: formData.value.color })
      toast.success('更新成功')
    } else {
      await createWorkItemLabel({ name: formData.value.name, color: formData.value.color })
      toast.success('创建成功')
    }
    formVisible.value = false
    await getList()
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 删除标签 */
async function handleDelete(item: WorkItemLabel) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除标签“${item.name}”吗？` })
  } catch {
    return
  }
  await deleteWorkItemLabel(item.id!)
  toast.success('删除成功')
  await getList()
  emit('success')
}

defineExpose({ open })
</script>
