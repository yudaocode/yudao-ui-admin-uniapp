<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="文档标签" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon
            v-if="hasAccessByCodes(['pms:kb:library:update'])"
            name="settings" size="38rpx" color="#333"
            @click="manageVisible = true"
          />
        </view>
      </template>
    </wd-navbar>

    <!-- 标签列表 -->
    <view class="bg-white py-16rpx">
      <scroll-view scroll-x class="whitespace-nowrap px-24rpx">
        <view
          v-for="item in labelList"
          :key="item.id"
          class="mr-16rpx inline-flex items-center gap-8rpx rounded-24rpx px-24rpx py-8rpx"
          :class="selectedLabelId === item.id ? 'bg-[#e6f4ff]' : 'bg-[#f7f8fa]'"
          @click="handleSelectLabel(item.id)"
        >
          <text class="h-16rpx w-16rpx rounded-full" :style="{ backgroundColor: item.color }" />
          <text class="text-26rpx" :class="selectedLabelId === item.id ? 'text-[#1677ff]' : 'text-[#333]'">
            {{ item.name }}
          </text>
        </view>
        <view v-if="!labelList.length" class="py-16rpx text-26rpx text-[#999]">
          暂无标签
        </view>
      </scroll-view>
    </view>

    <!-- 当前标签文档列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无文档"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-8rpx truncate text-32rpx text-[#333] font-semibold">
            {{ item.title }}
          </view>
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text class="min-w-0 flex-1 truncate">{{ item.libraryName }} · {{ item.creatorUserName || '-' }}</text>
            <text class="shrink-0 text-24rpx text-[#999]">{{ formatDateTime(item.updateTime) || '-' }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 标签管理弹窗 -->
    <wd-popup v-model="manageVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="flex flex-col" :style="{ maxHeight: '80vh' }">
        <view class="flex items-center justify-between p-32rpx pb-16rpx">
          <text class="text-32rpx text-[#333] font-semibold">管理文档标签</text>
          <wd-button
            v-if="hasAccessByCodes(['pms:kb:library:update'])"
            size="small" type="primary" variant="plain"
            @click="handleAdd"
          >
            新增标签
          </wd-button>
        </view>
        <scroll-view scroll-y class="min-h-0 flex-1 px-32rpx">
          <wd-empty v-if="!labelList.length" description="暂无标签" />
          <view
            v-for="item in labelList"
            :key="item.id"
            class="mb-20rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-20rpx"
          >
            <wd-tag :custom-style="getColorTagStyle(item.color)">
              {{ item.name }}
            </wd-tag>
            <view class="flex gap-16rpx">
              <wd-button
                v-if="hasAccessByCodes(['pms:kb:library:update'])"
                size="small" variant="plain"
                @click="handleEdit(item)"
              >
                编辑
              </wd-button>
              <wd-button
                v-if="hasAccessByCodes(['pms:kb:library:delete'])"
                size="small" type="danger" variant="plain"
                @click="handleDelete(item)"
              >
                删除
              </wd-button>
            </view>
          </view>
        </scroll-view>
        <view class="p-32rpx pt-16rpx">
          <wd-button block variant="plain" @click="manageVisible = false">
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
            <wd-input v-model.trim="formData.name" placeholder="请输入标签名称" :maxlength="255" />
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
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeDocument } from '@/api/pms/kb/content/document'
import type { KnowledgeDocumentLabel } from '@/api/pms/kb/content/document/label'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createKnowledgeDocumentLabel, deleteKnowledgeDocumentLabel, getKnowledgeDocumentLabelList, getKnowledgeDocumentPageByLabel, updateKnowledgeDocumentLabel } from '@/api/pms/kb/content/document/label'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { getColorTagStyle } from '@/utils/format'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const labelList = ref<KnowledgeDocumentLabel[]>([]) // 标签列表
const selectedLabelId = ref<number>() // 当前标签编号
const list = ref<KnowledgeDocument[]>([]) // 文档列表
const pagingRef = ref<any>() // 分页组件引用
const manageVisible = ref(false) // 标签管理弹窗显示状态
const formVisible = ref(false) // 标签表单弹窗显示状态
const formLoading = ref(false) // 表单提交中
const formData = ref<Partial<KnowledgeDocumentLabel>>({ name: '', color: '#409EFF' }) // 标签表单数据

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

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询标签列表 */
async function getLabelList() {
  labelList.value = await getKnowledgeDocumentLabelList()
  if (!labelList.value.some(item => item.id === selectedLabelId.value)) {
    selectedLabelId.value = labelList.value[0]?.id
  }
  pagingRef.value?.reload()
}

/** 查询标签下的文档分页 */
async function queryList(pageNo: number, pageSize: number) {
  if (!selectedLabelId.value) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = await getKnowledgeDocumentPageByLabel({
      pageNo,
      pageSize,
      labelId: selectedLabelId.value,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 选择标签 */
function handleSelectLabel(id: number) {
  selectedLabelId.value = id
  pagingRef.value?.reload()
}

/** 打开文档详情 */
function handleDetail(item: KnowledgeDocument) {
  uni.navigateTo({ url: `/pages-pms/kb/library/document/index?id=${item.id}` })
}

/** 新增标签 */
function handleAdd() {
  formData.value = { name: '', color: '#409EFF' }
  formVisible.value = true
}

/** 编辑标签 */
function handleEdit(item: KnowledgeDocumentLabel) {
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
      await updateKnowledgeDocumentLabel({ id: formData.value.id, name: formData.value.name, color: formData.value.color })
      toast.success('更新成功')
    } else {
      await createKnowledgeDocumentLabel({ name: formData.value.name, color: formData.value.color })
      toast.success('创建成功')
    }
    formVisible.value = false
    await getLabelList()
  } finally {
    formLoading.value = false
  }
}

/** 删除标签 */
async function handleDelete(item: KnowledgeDocumentLabel) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除标签“${item.name}”吗？` })
  } catch {
    return
  }
  await deleteKnowledgeDocumentLabel(item.id)
  toast.success('删除成功')
  await getLabelList()
}

/** 初始化 */
onMounted(() => {
  getLabelList()
})
</script>
