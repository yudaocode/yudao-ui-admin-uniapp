<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="知识库分组"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <!-- 分组说明 -->
        <view class="mb-24rpx text-26rpx text-[#999]">
          知识库分组是个人视图，不会影响其他成员
        </view>

        <!-- 分组列表 -->
        <view class="group-sort-list">
          <view
            v-for="(item, index) in list"
            :key="item.id"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.name }}
              </view>
              <wd-tag type="default" plain>
                {{ item.type === PmsKnowledgeGroupType.CUSTOM ? '自定义分组' : '默认分组' }}
              </wd-tag>
            </view>
            <view class="mb-16rpx text-28rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">知识库数量：</text>{{ item.libraryCount ?? 0 }}
            </view>
            <view class="flex items-center justify-end gap-16rpx">
              <template v-if="hasAccessByCodes(['pms:kb:library:update'])">
                <wd-button size="small" variant="plain" :disabled="index === 0" @click="handleMove(index, -1)">
                  上移
                </wd-button>
                <wd-button size="small" variant="plain" :disabled="index === list.length - 1" @click="handleMove(index, 1)">
                  下移
                </wd-button>
              </template>
              <template v-if="item.type === PmsKnowledgeGroupType.CUSTOM">
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
              </template>
            </view>
          </view>
        </view>

        <wd-empty v-if="!list.length" description="暂无分组" />
      </view>
    </scroll-view>

    <!-- 保存排序按钮 -->
    <view v-if="sortChanged && hasAccessByCodes(['pms:kb:library:update'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button block type="primary" :loading="sortLoading" @click="handleSaveSort">
          保存排序
        </wd-button>
      </view>
    </view>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['pms:kb:library:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 分组表单弹窗 -->
    <wd-popup v-model="formVisible" position="bottom" root-portal>
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formData.id ? '编辑分组' : '新增分组' }}
        </view>
        <wd-input
          v-model.trim="formData.name"
          label="分组名称"
          label-width="160rpx"
          placeholder="请输入分组名称"
          clearable
          :maxlength="100"
          show-word-limit
        />
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
import type { KnowledgeGroup } from '@/api/pms/kb/library/group'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  createKnowledgeGroup,
  deleteKnowledgeGroup,
  getKnowledgeGroupList,
  updateKnowledgeGroup,
  updateKnowledgeGroupSort,
} from '@/api/pms/kb/library/group'
import { useAccess } from '@/hooks/useAccess'
import { PmsKnowledgeGroupType } from '@/pages-pms/kb/utils/constants'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

let groupSortable: { destroy: () => void } | undefined // 分组拖拽实例

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<KnowledgeGroup[]>([]) // 分组列表
const sortChanged = ref(false) // 分组排序是否发生变化
const sortLoading = ref(false) // 保存排序的加载中
const formVisible = ref(false) // 分组表单弹窗显示状态
const formLoading = ref(false) // 表单提交中
const formData = ref<Partial<KnowledgeGroup>>({ name: '' }) // 分组表单数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 初始化分组拖拽（仅 H5；上移/下移按钮作为通用兜底保留） */
async function initGroupSortable() {
  groupSortable?.destroy()
  groupSortable = undefined
  // #ifdef H5
  if (!hasAccessByCodes(['pms:kb:library:update'])) {
    return
  }
  const Sortable = (await import('sortablejs')).default
  const el = document.querySelector('.group-sort-list')
  if (el) {
    groupSortable = Sortable.create(el as HTMLElement, {
      animation: 150,
      onEnd: ({ oldIndex, newIndex }) => {
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
          return
        }
        const [item] = list.value.splice(oldIndex, 1)
        list.value.splice(newIndex, 0, item)
        sortChanged.value = true
      },
    })
  }
  // #endif
}

/** 查询知识库分组列表 */
async function getList() {
  list.value = await getKnowledgeGroupList()
  sortChanged.value = false
  await nextTick()
  initGroupSortable()
}

/** 本地调整分组顺序 */
function handleMove(index: number, offset: number) {
  const target = index + offset
  const [item] = list.value.splice(index, 1)
  list.value.splice(target, 0, item)
  sortChanged.value = true
}

/** 保存排序按钮操作 */
async function handleSaveSort() {
  sortLoading.value = true
  try {
    await updateKnowledgeGroupSort(list.value.map((item, index) => ({ id: item.id!, sort: index })))
    toast.success('排序保存成功')
    sortChanged.value = false
    uni.$emit('pms:kb:library:reload')
  } finally {
    sortLoading.value = false
  }
}

/** 新增分组 */
function handleAdd() {
  formData.value = { name: '' }
  formVisible.value = true
}

/** 编辑分组（携带原 sort/type，避免后端全量更新时被置空） */
function handleEdit(item: KnowledgeGroup) {
  formData.value = { id: item.id, name: item.name, sort: item.sort, type: item.type }
  formVisible.value = true
}

/** 提交分组表单 */
async function handleSubmit() {
  const name = formData.value.name?.trim()
  if (!name) {
    toast.warning('分组名称不能为空')
    return
  }
  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateKnowledgeGroup({ ...formData.value, name })
      toast.success('修改成功')
    } else {
      await createKnowledgeGroup({ name })
      toast.success('新增成功')
    }
    formVisible.value = false
    await getList()
    uni.$emit('pms:kb:library:reload')
  } finally {
    formLoading.value = false
  }
}

/** 删除分组 */
async function handleDelete(item: KnowledgeGroup) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除分组“${item.name}”吗？知识库会回到未分组。` })
  } catch {
    return
  }
  await deleteKnowledgeGroup(item.id)
  toast.success('删除成功')
  await getList()
  uni.$emit('pms:kb:library:reload')
}

/** 初始化 */
onMounted(() => {
  getList()
})

/** 卸载 */
onUnmounted(() => {
  groupSortable?.destroy()
})
</script>
