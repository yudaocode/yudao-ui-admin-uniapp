<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="笔记目录"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 目录列表 -->
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <view class="flex items-center gap-16rpx">
              <wd-button size="small" variant="plain" @click="handleEdit(item)">
                编辑
              </wd-button>
              <wd-button size="small" type="danger" variant="plain" @click="handleDelete(item)">
                删除
              </wd-button>
            </view>
          </view>
          <view class="mt-12rpx text-24rpx text-[#999]">
            排序：{{ item.sort ?? 0 }}
          </view>
        </view>

        <wd-empty v-if="!list.length" description="暂无目录" />
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 目录表单弹窗 -->
    <wd-popup v-model="formVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formData.id ? '编辑目录' : '新增目录' }}
        </view>
        <wd-input
          v-model.trim="formData.name"
          label="目录名称"
          label-width="160rpx"
          placeholder="请输入目录名称"
          clearable
          :maxlength="255"
          show-word-limit
        />
        <view class="mt-24rpx flex items-center">
          <text class="w-160rpx text-28rpx text-[#333]">显示排序</text>
          <wd-input-number v-model="formData.sort" :min="0" />
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
  </view>
</template>

<script lang="ts" setup>
import type { NoteCategory } from '@/api/oa/note/category'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createNoteCategory,
  deleteNoteCategory,
  getNoteCategoryList,
  updateNoteCategory,
} from '@/api/oa/note/category'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const list = ref<NoteCategory[]>([]) // 目录列表
const formVisible = ref(false) // 目录表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<NoteCategory>>({ name: '', sort: 0 }) // 目录表单数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询目录列表 */
async function getList() {
  list.value = await getNoteCategoryList()
}

/** 新增目录 */
function handleAdd() {
  formData.value = { name: '', sort: 0 }
  formVisible.value = true
}

/** 编辑目录 */
function handleEdit(item: NoteCategory) {
  formData.value = { id: item.id, name: item.name, sort: item.sort }
  formVisible.value = true
}

/** 提交目录表单 */
async function handleSubmit() {
  const name = formData.value.name?.trim()
  if (!name) {
    toast.warning('目录名称不能为空')
    return
  }
  formLoading.value = true
  try {
    const data = { id: formData.value.id, name, sort: formData.value.sort ?? 0 } as NoteCategory
    if (formData.value.id) {
      await updateNoteCategory(data)
      toast.success('修改成功')
    } else {
      await createNoteCategory(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    await getList()
    uni.$emit('oa:note-category:reload')
  } finally {
    formLoading.value = false
  }
}

/** 删除目录 */
async function handleDelete(item: NoteCategory) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除目录“${item.name}”及目录内的所有笔记吗？` })
  } catch {
    return
  }
  await deleteNoteCategory(item.id!)
  toast.success('删除成功')
  await getList()
  uni.$emit('oa:note-category:reload')
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
