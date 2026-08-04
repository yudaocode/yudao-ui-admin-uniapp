<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="我的档案"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <template v-if="accessible">
      <!-- 头部摘要 -->
      <view v-if="employee.id" class="bg-white px-24rpx py-24rpx">
        <view class="mb-16rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-semibold">
            {{ employee.name || '-' }}
          </view>
          <view class="flex shrink-0 flex-col items-end gap-8rpx">
            <dict-tag
              v-if="employee.entryStatus != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_ENTRY_STATUS"
              :value="employee.entryStatus"
            />
            <dict-tag
              v-if="employee.status != null"
              :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
              :value="employee.status"
            />
          </view>
        </view>
        <view class="text-26rpx text-[#666]">
          {{ employee.deptName || '-' }} · {{ employee.postName || '-' }}
        </view>
        <view class="mt-8rpx text-26rpx text-[#666]">
          工号：{{ employee.jobNumber || '-' }}
        </view>
        <view class="mt-16rpx flex justify-end">
          <wd-button size="small" type="primary" :loading="loading" @click="refreshEmployee">
            刷新
          </wd-button>
        </view>
      </view>

      <!-- 详情分类 -->
      <view class="bg-white">
        <wd-tabs v-model="tabIndex" slidable="always">
          <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
        </wd-tabs>
      </view>

      <view v-if="loading && !employee.id" class="py-64rpx text-center text-26rpx text-[#999]">
        <wd-loading size="32rpx" />
        <view class="mt-12rpx">
          正在加载我的档案
        </view>
      </view>

      <view v-else-if="activeTab === 'base'" :class="canEdit ? 'pb-160rpx' : 'pb-40rpx'">
        <BaseInfo
          ref="baseInfoRef"
          :employee="employee"
          :field-config-list="fieldConfigList"
        />
      </view>

      <view v-else :class="canEdit ? 'pb-160rpx' : 'pb-40rpx'">
        <PostInfo ref="postInfoRef" :employee="employee" />
      </view>

      <!-- 底部操作 -->
      <view v-if="canEdit && activeTab === 'base'" class="yd-detail-footer">
        <view class="yd-detail-footer-actions">
          <wd-button class="flex-1" type="primary" @click="handleEdit">
            编辑
          </wd-button>
        </view>
      </view>
    </template>
  </view>
</template>

<script lang="ts" setup>
import type { EmployeeFieldConfig } from '@/api/hrm/employee/config'
import type { PortalEmployee } from '@/api/hrm/portal/employee'
import { onShow } from '@dcloudio/uni-app'
import { computed, nextTick, ref } from 'vue'
import { getPortalEmployee } from '@/api/hrm/portal/employee'
import { getPortalEmployeeFieldConfigList } from '@/api/hrm/portal/employee/field-config'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { checkHrmPortalAccess } from '@/pages-hrm/utils/portal'
import BaseInfo from './components/base-info.vue'
import PostInfo from './components/post-info.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs = [ // tab 配置
  { key: 'base', title: '基本信息' },
  { key: 'post', title: '岗位信息' },
]

const { hasAccessByCodes } = useAccess()
const accessible = ref(false) // 是否允许访问员工端
const loading = ref(false) // 页面加载中
const tabIndex = ref(0) // 当前详情分类下标
const employee = ref<PortalEmployee>({} as PortalEmployee) // 当前员工档案
const fieldConfigList = ref<EmployeeFieldConfig[]>([]) // 员工档案字段配置
const baseInfoRef = ref<InstanceType<typeof BaseInfo>>() // 基本信息 Ref
const postInfoRef = ref<InstanceType<typeof PostInfo>>() // 岗位信息 Ref

const activeTab = computed(() => tabs[tabIndex.value].key)
const hasEditableFields = computed(() => fieldConfigList.value.some(field => field.editable)) // 是否存在可编辑字段
const canEdit = computed(() => // 字段配置允许且具备员工端更新权限
  hasEditableFields.value && hasAccessByCodes(['hrm:portal:employee:update']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获得当前员工档案和字段配置 */
async function getEmployee() {
  loading.value = true
  try {
    const [employeeData, fields] = await Promise.all([
      getPortalEmployee(),
      getPortalEmployeeFieldConfigList(),
    ])
    employee.value = employeeData
    fieldConfigList.value = fields
  } finally {
    loading.value = false
  }
}

/** 刷新当前页签附属列表 */
async function refreshActiveTabList() {
  await nextTick()
  if (activeTab.value === 'base') {
    await baseInfoRef.value?.getList()
  } else {
    await postInfoRef.value?.getQuitInfo()
  }
}

/** 刷新当前员工档案页面 */
async function refreshEmployee() {
  await getEmployee()
  await refreshActiveTabList()
}

/** 打开员工档案编辑页 */
function handleEdit() {
  uni.navigateTo({ url: '/pages-hrm/portal/employee/form/index' })
}

/** 初始化 */
onShow(async () => {
  accessible.value = await checkHrmPortalAccess()
  if (!accessible.value) {
    return
  }
  await getEmployee()
  await refreshActiveTabList()
})
</script>
