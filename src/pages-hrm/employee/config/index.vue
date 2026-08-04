<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="员工管理设置"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleTabChange">
        <wd-tab
          v-for="(tab, index) in tabs"
          :key="tab.key"
          :name="index"
          :title="tab.title"
        />
      </wd-tabs>
    </view>

    <!-- 字段配置列表 -->
    <view class="p-24rpx pb-160rpx">
      <view v-if="loading" class="py-80rpx text-center text-28rpx text-[#999]">
        加载中...
      </view>

      <!-- 新建员工字段设置 -->
      <template v-else-if="activeTab === 'create'">
        <view
          v-if="createGroups.length === 0"
          class="rounded-12rpx bg-white py-80rpx text-center text-28rpx text-[#999] shadow-sm"
        >
          暂无字段配置
        </view>
        <view
          v-for="group in createGroups"
          :key="group.name"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="border-b border-[#f0f0f0] px-24rpx py-20rpx text-26rpx text-[#999]">
            {{ group.name }}
          </view>
          <view
            v-for="item in group.items"
            :key="item.name"
            class="border-b border-[#f5f5f5] px-24rpx py-24rpx last:border-b-0"
          >
            <view class="mb-16rpx text-28rpx text-[#333] font-medium">
              {{ item.title }}
            </view>
            <view class="flex flex-col gap-16rpx">
              <view class="flex items-center justify-between">
                <text class="text-26rpx text-[#666]">新建在职员工</text>
                <wd-switch
                  v-model="item.activeVisible"
                  :disabled="!hasAccessByCodes(['hrm:employee:config:update']) || item.activeVisibleLocked"
                  size="20px"
                />
              </view>
              <view class="flex items-center justify-between">
                <text class="text-26rpx text-[#666]">新建待入职员工</text>
                <wd-switch
                  v-model="item.pendingEntryVisible"
                  :disabled="!hasAccessByCodes(['hrm:employee:config:update']) || item.pendingEntryVisibleLocked"
                  size="20px"
                />
              </view>
            </view>
          </view>
        </view>
      </template>

      <!-- 员工档案设置 -->
      <template v-else>
        <view
          v-if="archiveGroups.length === 0"
          class="rounded-12rpx bg-white py-80rpx text-center text-28rpx text-[#999] shadow-sm"
        >
          暂无字段配置
        </view>
        <view
          v-for="group in archiveGroups"
          :key="group.name"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="border-b border-[#f0f0f0] px-24rpx py-20rpx text-26rpx text-[#999]">
            {{ group.name }}
          </view>
          <view
            v-for="item in group.items"
            :key="item.name"
            class="border-b border-[#f5f5f5] px-24rpx py-24rpx last:border-b-0"
          >
            <view class="mb-16rpx text-28rpx text-[#333] font-medium">
              {{ item.title }}
            </view>
            <view class="flex flex-col gap-16rpx">
              <view class="flex items-center justify-between">
                <text class="text-26rpx text-[#666]">员工是否可见</text>
                <wd-switch
                  :model-value="item.visible"
                  :disabled="!hasAccessByCodes(['hrm:employee:config:update']) || item.visibleLocked"
                  size="20px"
                  @change="event => handleVisibleChange(item, Boolean(event.value))"
                />
              </view>
              <view class="flex items-center justify-between">
                <text class="text-26rpx text-[#666]">员工是否可编辑</text>
                <wd-switch
                  :model-value="Boolean(item.editable)"
                  :disabled="!hasAccessByCodes(['hrm:employee:config:update'])
                    || !item.visible
                    || item.editableLocked"
                  size="20px"
                  @change="event => handleEditableChange(item, Boolean(event.value))"
                />
              </view>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- 底部保存按钮 -->
    <view v-if="hasAccessByCodes(['hrm:employee:config:update'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" :loading="saving" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeFieldConfig } from '@/api/hrm/employee/config'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  getEmployeeArchiveFieldConfigList,
  getEmployeeCreateFieldConfigList,
  saveEmployeeArchiveFieldConfig,
  saveEmployeeCreateFieldConfig,
} from '@/api/hrm/employee/config'
import { useAccess } from '@/hooks/useAccess'
import { HrmEmployeeEntryStatus } from '@/pages-hrm/utils/constants'
import { navigateBackPlus } from '@/utils'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

/** 新建员工字段配置行 */
interface EmployeeCreateFieldConfig extends EmployeeFieldConfig {
  activeVisible: boolean
  activeVisibleLocked: boolean
  pendingEntryVisible: boolean
  pendingEntryVisibleLocked: boolean
}

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const loading = ref(true) // 列表加载中
const saving = ref(false) // 保存中
const tabIndex = ref(0) // 当前页签
const createList = ref<EmployeeCreateFieldConfig[]>([]) // 新建员工字段
const archiveList = ref<EmployeeFieldConfig[]>([]) // 员工档案字段
const tabs = [ // 页签配置；对齐 PC 新建字段 / 档案设置
  { key: 'create', title: '新建员工字段' },
  { key: 'archive', title: '员工档案设置' },
]

const activeTab = computed(() => tabs[tabIndex.value]?.key || 'create') // 当前页签 key

const createGroups = computed(() => { // 新建字段按分组展示
  return groupFields(createList.value)
})
const archiveGroups = computed(() => { // 档案字段按分组展示
  return groupFields(archiveList.value)
})

/** 按字段分组 */
function groupFields<T extends { groupName: string }>(list: T[]) {
  const groupMap = new Map<string, T[]>()
  list.forEach((item) => {
    const groupName = item.groupName || '其他'
    const items = groupMap.get(groupName) || []
    items.push(item)
    groupMap.set(groupName, items)
  })
  return Array.from(groupMap.entries()).map(([name, items]) => ({ name, items }))
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 切换页签 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
}

/** 查询新建员工字段配置 */
async function getCreateList() {
  const [activeFields, pendingEntryFields] = await Promise.all([
    getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.ACTIVE),
    getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.PENDING_ENTRY),
  ])
  const pendingEntryFieldMap = new Map(pendingEntryFields.map(field => [field.name, field]))
  createList.value = activeFields.map((field) => {
    const pendingEntryField = pendingEntryFieldMap.get(field.name)
    return {
      ...field,
      activeVisible: field.visible,
      activeVisibleLocked: field.visibleLocked,
      pendingEntryVisible: pendingEntryField?.visible ?? false,
      pendingEntryVisibleLocked: pendingEntryField?.visibleLocked ?? false,
    }
  })
}

/** 查询员工档案字段配置 */
async function getArchiveList() {
  archiveList.value = await getEmployeeArchiveFieldConfigList()
}

/** 切换档案字段可见 */
function handleVisibleChange(field: EmployeeFieldConfig, visible: boolean) {
  field.visible = visible
  if (!visible) {
    field.editable = false
  }
}

/** 切换档案字段可编辑 */
function handleEditableChange(field: EmployeeFieldConfig, editable: boolean) {
  field.editable = editable
  if (editable) {
    field.visible = true
  }
}

/** 保存字段配置 */
async function handleSubmit() {
  saving.value = true
  try {
    if (activeTab.value === 'create') {
      await Promise.all([
        saveEmployeeCreateFieldConfig(
          HrmEmployeeEntryStatus.ACTIVE,
          createList.value.map(item => ({
            name: item.name,
            visible: item.activeVisible,
          })),
        ),
        saveEmployeeCreateFieldConfig(
          HrmEmployeeEntryStatus.PENDING_ENTRY,
          createList.value.map(item => ({
            name: item.name,
            visible: item.pendingEntryVisible,
          })),
        ),
      ])
      toast.success('保存成功')
      await getCreateList()
      return
    }
    await saveEmployeeArchiveFieldConfig(
      archiveList.value.map(item => ({
        name: item.name,
        visible: item.visible,
        editable: item.editable,
      })),
    )
    toast.success('保存成功')
    await getArchiveList()
  } finally {
    saving.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([getCreateList(), getArchiveList()])
  } finally {
    loading.value = false
  }
})
</script>
