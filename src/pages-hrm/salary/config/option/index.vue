<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="工资表设置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :name="index"
          :title="tab.title"
        />
      </wd-tabs>
    </view>

    <!-- 薪资项列表 -->
    <view class="p-24rpx pb-160rpx">
      <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
        加载中...
      </view>
      <view
        v-else-if="activeList.length === 0"
        class="rounded-12rpx bg-white py-80rpx text-center text-28rpx text-[#999] shadow-sm"
      >
        暂无薪资项
      </view>
      <view
        v-for="category in activeList"
        :key="category.id"
        class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <!-- 分类 -->
        <view class="flex items-center justify-between gap-16rpx border-b border-[#f0f0f0] px-24rpx py-24rpx">
          <view class="min-w-0 flex-1">
            <view class="flex items-center gap-12rpx">
              <text class="truncate text-30rpx text-[#333] font-semibold">
                {{ category.name }}
              </text>
              <view class="shrink-0 rounded-6rpx bg-[#f5f5f5] px-12rpx py-4rpx text-22rpx text-[#999]">
                分类
              </view>
            </view>
            <view v-if="category.remark" class="mt-8rpx text-24rpx text-[#999]">
              {{ category.remark }}
            </view>
          </view>
          <view
            v-if="activeTab === 'enterprise' && isOptionalCategory(category)"
            class="flex shrink-0 items-center gap-12rpx"
            @click.stop
          >
            <text class="text-24rpx text-[#999]">启用</text>
            <wd-switch
              :model-value="category.enabled"
              :disabled="!hasAccessByCodes(['hrm:salary:option:update']) || switchingId === category.id"
              size="20px"
              @change="event => handleUpdateEnabled(category, Boolean(event.value))"
            />
          </view>
        </view>

        <!-- 分类操作：添加薪资项 -->
        <view
          v-if="activeTab === 'enterprise' && isOptionalCategory(category) && category.enabled"
          class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-16rpx"
        >
          <text class="text-24rpx text-[#999]">
            {{ (category.children || []).length }} 个薪资项
          </text>
          <wd-button
            v-if="hasAccessByCodes(['hrm:salary:option:create'])"
            size="small"
            type="primary"
            variant="text"
            @click="openAddSheet(category)"
          >
            添加薪资项
          </wd-button>
        </view>

        <!-- 子薪资项 -->
        <view
          v-for="item in (category.children || [])"
          :key="item.id"
          class="border-b border-[#f5f5f5] px-24rpx py-20rpx last:border-b-0"
        >
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="flex flex-wrap items-center gap-12rpx">
                <text class="text-28rpx text-[#333] font-medium">
                  {{ item.name }}
                </text>
                <view
                  class="rounded-6rpx px-12rpx py-4rpx text-22rpx"
                  :class="item.templateId ? 'bg-[#fff7e6] text-[#fa8c16]' : 'bg-[#e6f4ff] text-[#1677ff]'"
                >
                  {{ item.templateId ? '标准项' : '自定义项' }}
                </view>
              </view>
              <view v-if="item.remark" class="mt-8rpx text-24rpx text-[#999]">
                {{ item.remark }}
              </view>
            </view>
            <wd-button
              v-if="activeTab === 'enterprise' && isEnterpriseOption(item) && hasAccessByCodes(['hrm:salary:option:delete'])"
              size="small"
              type="danger"
              variant="text"
              :loading="deletingId === item.id"
              @click="handleDelete(item)"
            >
              删除
            </wd-button>
          </view>
          <view class="flex flex-wrap items-center gap-16rpx text-24rpx text-[#666]">
            <view class="flex items-center gap-8rpx">
              <text class="text-[#999]">加减：</text>
              <text>{{ formatHrmSalaryOptionType(item.type) }}</text>
            </view>
            <view class="flex items-center gap-8rpx">
              <text class="text-[#999]">计税：</text>
              <dict-tag
                :type="DICT_TYPE.HRM_SALARY_YES_NO"
                :value="item.taxEnabled ? 1 : 0"
              />
            </view>
            <view
              v-if="activeTab === 'system' && isSystemStandardOption(item)"
              class="ml-auto flex items-center gap-12rpx"
              @click.stop
            >
              <text class="text-[#999]">显示</text>
              <wd-switch
                :model-value="item.visible"
                :disabled="!hasAccessByCodes(['hrm:salary:option:update']) || switchingId === item.id"
                size="20px"
                @change="event => handleUpdateVisible(item, Boolean(event.value))"
              />
            </view>
          </view>
        </view>

        <view
          v-if="!(category.children || []).length"
          class="px-24rpx py-32rpx text-center text-24rpx text-[#999]"
        >
          {{ activeTab === 'enterprise' && !category.enabled ? '分类未启用' : '暂无薪资项' }}
        </view>
      </view>
    </view>

    <!-- 添加薪资项 -->
    <wd-action-sheet
      v-model="addSheetVisible"
      :actions="addActions"
      cancel-text="取消"
      @select="handleAddSelect"
    />

    <!-- 同步标准薪资项 -->
    <view
      v-if="hasAccessByCodes(['hrm:salary:option:update'])"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="syncing" @click="handleSync">
          同步标准薪资项
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SalaryOption } from '@/api/hrm/salary/config/option'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  deleteSalaryOption,
  getSalaryOptionList,
  syncSalaryOption,
  updateSalaryOptionEnabled,
  updateSalaryOptionVisible,
} from '@/api/hrm/salary/config/option'
import { useAccess } from '@/hooks/useAccess'
import { formatHrmSalaryOptionType } from '@/pages-hrm/utils/format'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const loading = ref(true) // 列表加载中
const syncing = ref(false) // 同步中
const switchingId = ref<number>() // 切换状态中的项
const deletingId = ref<number>() // 删除中的项
const list = ref<SalaryOption[]>([]) // 工资项树
const tabIndex = ref(0) // 当前页签
const tabs = [ // 页签配置
  { key: 'enterprise', title: '企业可选项' },
  { key: 'system', title: '系统默认项' },
]
const activeTab = computed(() => tabs[tabIndex.value]?.key || 'enterprise') // 当前页签 key
const addSheetVisible = ref(false) // 添加弹层
const currentCategory = ref<SalaryOption>() // 当前添加分类

const enterpriseOptionList = computed(() => { // 企业可选项
  return list.value
    .filter(item => !item.systemFlag)
    .map(item => ({
      ...item,
      children: item.enabled ? (item.children || []).filter(child => child.enabled) : [],
    }))
})
const systemOptionList = computed(() => list.value.filter(item => item.systemFlag)) // 系统默认项
const activeList = computed(() => { // 当前工资项树
  return activeTab.value === 'enterprise' ? enterpriseOptionList.value : systemOptionList.value
})

const inactiveStandardOptions = computed(() => { // 当前分类下已停用的标准项
  if (!currentCategory.value) {
    return []
  }
  const sourceCategory = list.value.find(item => item.id === currentCategory.value?.id)
  return (sourceCategory?.children || []).filter(item => item.templateId && !item.enabled)
})

const addActions = computed(() => { // 添加薪资项操作
  const actions = inactiveStandardOptions.value.map(item => ({
    name: item.name,
    value: String(item.code),
  }))
  actions.push({
    name: '自定义薪资项',
    value: 'custom',
  })
  return actions
})

/** 是否为工资项分类 */
function isCategory(option: SalaryOption) {
  return !option.parentCode
}

/** 是否为可选分类 */
function isOptionalCategory(option: SalaryOption) {
  return isCategory(option) && !!option.templateId && !option.systemFlag
}

/** 是否为企业可选薪资项 */
function isEnterpriseOption(option: SalaryOption) {
  return !isCategory(option) && !option.systemFlag
}

/** 是否为系统标准薪资项 */
function isSystemStandardOption(option: SalaryOption) {
  return !isCategory(option) && !!option.templateId && option.systemFlag
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询工资表薪资项树 */
async function getList() {
  loading.value = true
  try {
    const data = await getSalaryOptionList()
    list.value = handleTree(data, 'code', 'parentCode')
  } finally {
    loading.value = false
  }
}

/** 打开添加薪资项弹层 */
function openAddSheet(category: SalaryOption) {
  currentCategory.value = category
  addSheetVisible.value = true
}

/** 添加薪资项 */
async function handleAddSelect({ item }: { item: { name: string, value: string } }) {
  if (!currentCategory.value) {
    return
  }
  // 1. 添加自定义薪资项
  if (item.value === 'custom') {
    uni.navigateTo({
      url: `/pages-hrm/salary/config/option/form/index?parentCode=${currentCategory.value.code}`,
    })
    return
  }
  // 2. 重新启用已移除的标准薪资项
  const option = inactiveStandardOptions.value.find(row => String(row.code) === item.value)
  if (!option) {
    return
  }
  await updateSalaryOptionEnabled(option.id, true)
  toast.success('创建成功')
  await getList()
}

/** 更新薪资项启用状态 */
async function handleUpdateEnabled(option: SalaryOption, enabled: boolean) {
  switchingId.value = option.id
  try {
    await updateSalaryOptionEnabled(option.id, enabled)
    toast.success('修改成功')
    await getList()
  } catch {
    await getList()
  } finally {
    switchingId.value = undefined
  }
}

/** 更新薪资项显示状态 */
async function handleUpdateVisible(option: SalaryOption, visible: boolean) {
  switchingId.value = option.id
  try {
    await updateSalaryOptionVisible(option.id, visible)
    toast.success('修改成功')
    await getList()
  } catch {
    await getList()
  } finally {
    switchingId.value = undefined
  }
}

/** 同步标准薪资项 */
async function handleSync() {
  if (syncing.value) {
    return
  }
  syncing.value = true
  try {
    await syncSalaryOption()
    toast.success('修改成功')
    await getList()
  } finally {
    syncing.value = false
  }
}

/** 删除企业可选薪资项 */
async function handleDelete(option: SalaryOption) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除薪资项「${option.name}」吗？`,
    })
  } catch {
    return
  }

  deletingId.value = option.id
  try {
    // 标准薪资项仅停用，企业自定义薪资项直接删除
    if (option.templateId) {
      await updateSalaryOptionEnabled(option.id, false)
    } else {
      await deleteSalaryOption(option.id)
    }
    toast.success('删除成功')
    await getList()
  } finally {
    deletingId.value = undefined
  }
}

/** 初始化 */
onMounted(() => {
  getList()
  uni.$on('hrm:salary:option:reload', getList)
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:salary:option:reload', getList)
})
</script>
