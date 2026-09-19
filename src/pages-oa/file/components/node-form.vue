<template>
  <!-- 新建文件夹、重命名、移动、复制弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="bg-white p-24rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        {{ dialogTitle }}
      </view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item v-if="formType === 'create' || formType === 'rename'" title="名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :maxlength="255"
              placeholder="请输入名称"
            />
          </wd-form-item>
          <wd-form-item v-else title="目标目录" title-width="180rpx" prop="parentId">
            <view class="flex items-center justify-end gap-12rpx" @click="treeVisible = true">
              <text class="text-28rpx" :class="formData.parentId === undefined ? 'text-[#999]' : 'text-[#333]'">
                {{ parentName || '请选择目标目录' }}
              </text>
            </view>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mt-24rpx flex gap-16rpx">
        <wd-button class="flex-1" variant="plain" :disabled="formLoading" @click="handleClose">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </wd-button>
      </view>
    </view>

    <!-- 目标目录树选择 -->
    <wd-popup v-model="treeVisible" position="bottom" custom-style="height: 60vh; border-radius: 24rpx 24rpx 0 0;">
      <view class="h-full flex flex-col bg-white">
        <view class="border-b border-[#f0f0f0] border-b-solid p-24rpx text-center text-30rpx text-[#333] font-semibold">
          选择目标目录
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y>
          <view
            v-for="item in flatDirectoryList"
            :key="item.id"
            class="flex items-center justify-between border-b border-[#f5f5f5] border-b-solid px-24rpx py-20rpx"
            @click="handleSelectDirectory(item)"
          >
            <view class="flex items-center gap-8rpx" :style="{ paddingLeft: `${item.depth * 40}rpx` }">
              <wd-icon name="folder" size="32rpx" color="#e6a23c" />
              <text class="text-28rpx text-[#333]">{{ item.name }}</text>
            </view>
            <wd-icon v-if="formData.parentId === item.id" name="check" size="32rpx" color="#1677ff" />
          </view>
        </scroll-view>
      </view>
    </wd-popup>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { FileNode } from '@/api/oa/file'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  copyFileNode,
  createFileNode,
  getFileDirectoryList,
  updateFileNodeName,
  updateFileNodeParent,
} from '@/api/oa/file'
import { createFormSchema } from '@/utils/wot'
import { OA_FILE_NODE_TYPE, OA_FILE_PARENT_ID_ROOT } from '../../utils/constants'

const emit = defineEmits<{
  success: []
}>() // 定义 success 事件，用于操作成功后的回调

const toast = useToast()
const visible = ref(false) // 弹窗显示状态
const treeVisible = ref(false) // 目录树弹窗显示状态
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中：1）目录加载；2）提交禁用
const formType = ref('') // 表单类型：create 新建文件夹；rename 重命名；move 移动；copy 复制
const formData = ref<FileNode>({
  id: undefined,
  name: '',
  parentId: OA_FILE_PARENT_ID_ROOT,
  type: OA_FILE_NODE_TYPE.FOLDER,
}) // 表单数据
const formSchema = createFormSchema({ // 表单校验规则
  name: [{ required: true, message: '名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const directoryList = ref<FileNode[]>([]) // 可移动的目录列表
const flatDirectoryList = computed(() => { // 平铺的目录树，携带层级缩进
  const result: (FileNode & { depth: number })[] = []
  const walk = (parentId: number, depth: number) => {
    directoryList.value
      .filter(item => item.parentId === parentId)
      .forEach((item) => {
        result.push({ ...item, depth })
        walk(item.id!, depth + 1)
      })
  }
  // 根目录「我的文件」作为可选项
  result.push({ id: OA_FILE_PARENT_ID_ROOT, name: '我的文件', depth: 0 } as FileNode & { depth: number })
  walk(OA_FILE_PARENT_ID_ROOT, 1)
  return result
})
const parentName = computed(() =>
  flatDirectoryList.value.find(item => item.id === formData.value.parentId)?.name || '') // 目标目录名称

/** 打开弹窗 */
async function open(type: string, parentId: number, row?: FileNode) {
  visible.value = true
  dialogTitle.value = { create: '新建文件夹', rename: '重命名', move: '移动', copy: '复制' }[type] || ''
  formType.value = type
  formData.value = {
    id: row?.id,
    name: row?.name || '',
    parentId: type === 'copy' ? OA_FILE_PARENT_ID_ROOT : parentId,
    type: OA_FILE_NODE_TYPE.FOLDER,
  }
  directoryList.value = []
  if (type !== 'move' && type !== 'copy') {
    return
  }
  // 加载目标目录，移除当前节点的整棵子树，避免移动到自身及下级目录
  formLoading.value = true
  try {
    const list = await getFileDirectoryList()
    if (!row?.id) {
      directoryList.value = list
      return
    }
    const excludedIds = new Set<number>([row.id])
    let changed = true
    while (changed) {
      changed = false
      list.forEach((item) => {
        if (!excludedIds.has(item.id!) && excludedIds.has(item.parentId)) {
          excludedIds.add(item.id!)
          changed = true
        }
      })
    }
    directoryList.value = list.filter(item => !excludedIds.has(item.id!))
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 选择目标目录 */
function handleSelectDirectory(item: FileNode) {
  formData.value.parentId = item.id!
  treeVisible.value = false
}

/** 关闭弹窗 */
function handleClose() {
  visible.value = false
  treeVisible.value = false
}

/** 提交表单 */
async function handleSubmit() {
  if (formType.value === 'create' || formType.value === 'rename') {
    const { valid } = await formRef.value.validate()
    if (!valid) {
      return
    }
  } else if (formData.value.parentId === undefined) {
    toast.warning('请选择目标目录')
    return
  }
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await createFileNode({
        parentId: formData.value.parentId!,
        type: OA_FILE_NODE_TYPE.FOLDER,
        name: formData.value.name!,
      })
      toast.success('新增成功')
    } else if (formType.value === 'move') {
      await updateFileNodeParent(formData.value.id!, formData.value.parentId!)
      toast.success('移动成功')
    } else if (formType.value === 'copy') {
      await copyFileNode(formData.value.id!, formData.value.parentId!)
      toast.success('复制成功')
    } else {
      await updateFileNodeName(formData.value.id!, formData.value.name!)
      toast.success('重命名成功')
    }
    handleClose()
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
