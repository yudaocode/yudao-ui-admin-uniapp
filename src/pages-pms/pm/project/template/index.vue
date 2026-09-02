<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="项目模板"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 模板列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无项目模板"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleEdit(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name }}
            </view>
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
          </view>
          <view class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">项目类型：</text>{{ formatProjectType(item.projectType) }}
          </view>
          <view class="mb-12rpx flex flex-wrap items-center gap-8rpx">
            <text class="text-28rpx text-[#999]">事项类型：</text>
            <wd-tag v-for="type in item.itemTypes" :key="type" type="primary" plain>
              {{ getWorkItemTypeName(type) }}
            </wd-tag>
          </view>
          <view class="flex items-center justify-between text-28rpx text-[#666]">
            <text>状态 {{ item.statuses.length }} · 看板列 {{ item.boards.length }}</text>
            <text class="shrink-0 text-[#999]">{{ formatDateTime(item.createTime) || '-' }}</text>
          </view>
          <view class="mt-16rpx flex justify-end gap-16rpx">
            <wd-button
              v-if="hasAccessByCodes(['pms:pm:project-template:update'])"
              size="small" variant="plain"
              @click.stop="handleEdit(item)"
            >
              编辑
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['pms:pm:project-template:delete'])"
              size="small" type="danger" variant="plain"
              @click.stop="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['pms:pm:project-template:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />
  </view>
</template>

<script lang="ts" setup>
import type { ProjectTemplate } from '@/api/pms/pm/project/template'
import { onUnload } from '@dcloudio/uni-app'
import { deleteProjectTemplate, getProjectTemplatePage } from '@/api/pms/pm/project/template'
import { useAccess } from '@/hooks/useAccess'
import { formatProjectType, getWorkItemTypeName } from '@/pages-pms/pm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<ProjectTemplate[]>([]) // 列表数据
const pagingRef = ref<any>() // 分页组件引用
const queryParams = ref<Record<string, any>>({}) // 查询参数

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询项目模板分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getProjectTemplatePage({ ...queryParams.value, pageNo, pageSize })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.value = { ...data }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({})
}

/** 新增项目模板 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-pms/pm/project/template/form/index' })
}

/** 编辑项目模板 */
function handleEdit(item: ProjectTemplate) {
  if (!hasAccessByCodes(['pms:pm:project-template:update'])) {
    return
  }
  uni.navigateTo({ url: `/pages-pms/pm/project/template/form/index?id=${item.id}` })
}

/** 删除项目模板 */
async function handleDelete(item: ProjectTemplate) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认删除模板“${item.name}”吗？` })
  } catch {
    return
  }
  await deleteProjectTemplate(item.id!)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('pms:pm:project-template:reload', reload)
})

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 卸载 */
onUnload(() => {
  uni.$off('pms:pm:project-template:reload', reload)
})
</script>
