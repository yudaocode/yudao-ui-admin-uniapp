<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': activeTab === 'employees' }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="组织详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 头部摘要 -->
    <view class="bg-white px-24rpx py-24rpx">
      <view class="mb-8rpx flex items-center gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-36rpx text-[#333] font-bold">
          {{ formData.name || '-' }}
        </view>
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
      </view>
      <view class="mb-16rpx text-24rpx text-[#999]">
        部门编号：{{ formData.id || '-' }}
      </view>
      <view class="grid grid-cols-3 gap-16rpx">
        <view class="rounded-12rpx bg-[#f5f5f5] px-16rpx py-16rpx text-center">
          <view class="text-24rpx text-[#999]">
            在职员工
          </view>
          <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
            {{ statistics.activeCount }}
          </view>
        </view>
        <view class="rounded-12rpx bg-[#f5f5f5] px-16rpx py-16rpx text-center">
          <view class="text-24rpx text-[#999]">
            全职员工
          </view>
          <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
            {{ statistics.fullTimeCount }}
          </view>
        </view>
        <view class="rounded-12rpx bg-[#f5f5f5] px-16rpx py-16rpx text-center">
          <view class="text-24rpx text-[#999]">
            非全职人数
          </view>
          <view class="mt-8rpx text-32rpx text-[#333] font-semibold">
            {{ statistics.nonFullTimeCount }}
          </view>
        </view>
      </view>
      <view class="mt-16rpx text-26rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">上级部门：</text>{{ parentDeptName || '-' }}
      </view>
      <view class="mt-8rpx text-26rpx text-[#666]">
        <text class="mr-8rpx text-[#999]">部门负责人：</text>{{ leaderUserName || '-' }}
      </view>
    </view>

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 详细资料 -->
    <wd-cell-group v-if="activeTab === 'details'" border>
      <wd-cell title="部门名称" :value="formData.name || '-'" />
      <wd-cell title="上级部门" :value="parentDeptName || '-'" />
      <wd-cell title="部门负责人" :value="leaderUserName || '-'" />
      <wd-cell title="显示排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
      <wd-cell title="联系电话" :value="formData.phone || '-'" />
      <wd-cell title="邮箱" :value="formData.email || '-'" />
      <wd-cell title="状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 员工列表 -->
    <EmployeeList
      v-else-if="activeTab === 'employees' && formData.id"
      class="min-h-0 flex-1"
      :dept-id="formData.id"
    />

    <!-- 底部操作（跳转系统部门管理） -->
    <view v-if="hasFooter && activeTab === 'details'" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['system:dept:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:dept:delete'])"
          class="flex-1"
          type="danger"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Dept } from '@/api/system/dept'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { getEmployeeDeptStatistics } from '@/api/hrm/employee'
import { getDept, getSimpleDeptList } from '@/api/system/dept'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import EmployeeList from '../components/employee-list.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const tabs = [ // tab 配置
  { key: 'details', title: '详细资料' },
  { key: 'employees', title: '员工列表' },
]

const { hasAccessByCodes } = useAccess()
const formData = ref<Dept>({} as Dept) // 详情数据
const parentDeptName = ref<string>() // 上级部门名称
const leaderUserName = ref<string>() // 部门负责人名称
const statistics = ref({
  activeCount: 0,
  fullTimeCount: 0,
  nonFullTimeCount: 0,
}) // 部门直属员工统计
const tabIndex = ref(0) // 当前详情分类下标
const activeTab = computed(() => tabs[tabIndex.value]?.key)
const hasFooter = computed(() => { // 底部操作区
  return hasAccessByCodes(['system:dept:update']) || hasAccessByCodes(['system:dept:delete'])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-hrm/dept/index')
}

/** 加载组织详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const deptId = Number(props.id)
  const [deptData, deptList, userList, statisticsList] = await Promise.all([
    getDept(deptId),
    getSimpleDeptList(),
    getSimpleUserList(),
    getEmployeeDeptStatistics(),
  ])
  formData.value = deptData
  parentDeptName.value = deptList.find(item => item.id === deptData.parentId)?.name
  leaderUserName.value = userList.find(item => item.id === deptData.leaderUserId)?.nickname
  const matched = statisticsList.find(item => item.deptId === deptId)
  statistics.value = matched
    ? {
        activeCount: matched.activeCount,
        fullTimeCount: matched.fullTimeCount,
        nonFullTimeCount: matched.nonFullTimeCount,
      }
    : {
        activeCount: 0,
        fullTimeCount: 0,
        nonFullTimeCount: 0,
      }
}

/** 编辑部门（跳转系统部门管理） */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/dept/form/index?id=${props.id}`,
  })
}

/** 删除部门（跳转系统部门详情） */
function handleDelete() {
  uni.navigateTo({
    url: `/pages-system/dept/detail/index?id=${props.id}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('hrm:dept:reload', getDetail)
  uni.$on('system:dept:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('hrm:dept:reload', getDetail)
  uni.$off('system:dept:reload', getDetail)
})
</script>
