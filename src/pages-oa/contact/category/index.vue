<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="联系人分类"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 分类列表 -->
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

        <wd-empty v-if="!list.length" description="暂无分类" />
      </view>
    </scroll-view>

    <!-- 新增按钮 -->
    <wd-fab
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 分类表单弹窗 -->
    <wd-popup v-model="formVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formData.id ? '编辑分类' : '新增分类' }}
        </view>
        <wd-input
          v-model.trim="formData.name"
          label="分类名称"
          label-width="160rpx"
          placeholder="请输入分类名称"
          clearable
          :maxlength="50"
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
import type { ContactCategory } from '@/api/oa/contact/category'
import { onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createContactCategory,
  deleteContactCategory,
  getContactCategoryList,
  updateContactCategory,
} from '@/api/oa/contact/category'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const list = ref<ContactCategory[]>([]) // 分类列表
const formVisible = ref(false) // 分类表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<ContactCategory>>({ name: '', sort: 0 }) // 分类表单数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询分类列表 */
async function getList() {
  list.value = await getContactCategoryList()
}

/** 新增分类 */
function handleAdd() {
  formData.value = { name: '', sort: 0 }
  formVisible.value = true
}

/** 编辑分类 */
function handleEdit(item: ContactCategory) {
  formData.value = { id: item.id, name: item.name, sort: item.sort }
  formVisible.value = true
}

/** 提交分类表单 */
async function handleSubmit() {
  const name = formData.value.name?.trim()
  if (!name) {
    toast.warning('分类名称不能为空')
    return
  }
  formLoading.value = true
  try {
    const data = { id: formData.value.id, name, sort: formData.value.sort ?? 0 } as ContactCategory
    if (formData.value.id) {
      await updateContactCategory(data)
      toast.success('修改成功')
    } else {
      await createContactCategory(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    await getList()
    uni.$emit('oa:contact-category:reload')
  } finally {
    formLoading.value = false
  }
}

/** 删除分类 */
async function handleDelete(item: ContactCategory) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除分类“${item.name}”吗？分类内的联系人将移至未分类，不会被删除。` })
  } catch {
    return
  }
  await deleteContactCategory(item.id!)
  toast.success('删除成功')
  await getList()
  uni.$emit('oa:contact-category:reload')
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
