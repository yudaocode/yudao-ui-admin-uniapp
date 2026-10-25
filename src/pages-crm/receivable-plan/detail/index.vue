<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': isPagingTab }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="回款计划详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情分类 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always">
        <wd-tab v-for="tab in tabs" :key="tab.key" :title="tab.title" />
      </wd-tabs>
    </view>

    <!-- 基本信息 -->
    <wd-cell-group v-if="activeTab === 'basic'" border>
      <wd-cell title="客户名称" :value="formData.customerName || '-'" />
      <wd-cell title="合同编号" :value="formData.contractNo || '-'" />
      <wd-cell title="期数" :value="formData.period != null ? formData.period : '-'" />
      <wd-cell title="计划回款金额" :value="formatMoney(formData.price)" />
      <wd-cell title="计划回款日期" :value="formatDate(formData.returnTime) || '-'" />
      <wd-cell title="提前提醒天数" :value="formData.remindDays != null ? formData.remindDays : '-'" />
      <wd-cell title="回款方式">
        <dict-tag v-if="formData.returnType != null && formData.returnType !== ''" :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="formData.returnType" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="负责人" :value="formData.ownerUserName || '-'" />
      <wd-cell title="实际回款金额" :value="formatMoney(formData.receivable?.price)" />
      <wd-cell title="未回款金额" :value="unreceivedPrice" />
      <wd-cell title="实际回款日期" :value="formatDate(formData.receivable?.returnTime) || '-'" />
      <wd-cell title="备注" :value="formData.remark || '-'" />
      <wd-cell title="创建人" :value="formData.creatorName || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      <wd-cell title="更新时间" :value="formatDateTime(formData.updateTime) || '-'" />
    </wd-cell-group>

    <!-- 团队成员（常驻挂载：底部业务操作需读取其权限校验） -->
    <CrmPermissionTeam
      v-if="planId"
      v-show="activeTab === 'team'"
      ref="teamRef"
      embedded
      :biz-id="planId"
      :biz-type="bizType"
      @quit-team="handleQuitTeam"
      @can-quit-change="(v: boolean) => teamCanQuit = v"
    />

    <!-- 操作日志 -->
    <CrmOperateLogs v-if="activeTab === 'log' && planId" class="min-h-0 flex-1" :biz-id="planId" :biz-type="bizType" />

    <!-- 底部操作（按 tab 区分，只放当前模块的操作） -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'basic'">
          <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="hasAccessByCodes(['crm:receivable-plan:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
          <wd-button v-if="moreActions.length" class="flex-1" type="info" @click="moreActionVisible = true">
            更多
          </wd-button>
        </template>
        <template v-else-if="activeTab === 'team'">
          <wd-button v-if="teamCanQuit" class="flex-1" type="danger" variant="plain" @click="teamRef?.quit()">
            退出团队
          </wd-button>
          <wd-button v-if="validateOwnerUser" class="flex-1" type="primary" @click="teamRef?.openAdd()">
            新增成员
          </wd-button>
        </template>
      </view>
    </view>

    <!-- 业务操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />
  </view>
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteReceivablePlan, getReceivablePlan } from '@/api/crm/receivable/plan'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'
import CrmPermissionTeam from '@/pages-crm/permission/components/permission-list.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_RECEIVABLE_PLAN
const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
  { key: 'team', title: '团队成员' },
  { key: 'log', title: '操作日志' },
]

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Record<string, any>>({}) // 详情数据
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const moreActionVisible = ref(false) // 业务操作菜单显示状态
const teamCanQuit = ref(false) // 是否可退出团队
const teamRef = ref<{ openAdd: () => void, quit: () => void, validateWrite: boolean, validateOwnerUser: boolean }>() // 团队成员引用（含权限校验）
const planId = computed(() => props.id)
const activeTab = computed(() => tabs[tabIndex.value].key)
const isPagingTab = computed(() => activeTab.value === 'log') // 操作日志 tab 用 z-paging 固定高布局
const validateWrite = computed(() => teamRef.value?.validateWrite ?? false) // 读写权限（负责人或读写成员）
const validateOwnerUser = computed(() => teamRef.value?.validateOwnerUser ?? false) // 负责人权限
const canEdit = computed(() => hasAccessByCodes(['crm:receivable-plan:update']) && validateWrite.value) // 可编辑（菜单权限 + 读写权限）
const unreceivedPrice = computed(() => { // 未回款金额 = 计划金额 − 实际回款金额
  const data = formData.value
  if (data.price == null || data.price === '') {
    return '-'
  }
  const received = data.receivable?.price
  const unreceived = received != null && received !== '' ? Number(data.price) - Number(received) : Number(data.price)
  return formatMoney(unreceived)
})
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions: { name: string, value: string }[] = []
  if (!data.receivableId && hasAccessByCodes(['crm:receivable:create'])) {
    actions.push({ name: '创建回款', value: 'createReceivable' })
  }
  return actions
})
const hasFooter = computed(() => {
  switch (activeTab.value) {
    case 'log':
      return false
    case 'basic':
      return canEdit.value || hasAccessByCodes(['crm:receivable-plan:delete']) || moreActions.value.length > 0
    case 'team':
      return teamCanQuit.value || validateOwnerUser.value
    default:
      return false
  }
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/receivable-plan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!planId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getReceivablePlan(planId.value)
  } finally {
    toast.close()
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    createReceivable: handleCreateReceivable,
  }
  handlers[item.value]?.()
}

/** 创建回款 */
function handleCreateReceivable() {
  const data = formData.value
  if (!data?.id) {
    return
  }
  const query = buildQuery({
    customerId: data.customerId,
    contractId: data.contractId,
    planId: data.id,
    price: data.price,
    returnType: data.returnType,
    ownerUserId: data.ownerUserId,
  })
  uni.navigateTo({ url: `/pages-crm/receivable/form/index${query ? `?${query}` : ''}` })
}

/** 构建跳转参数 */
function buildQuery(data: Record<string, any>) {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&')
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:receivablePlan:reload')
  delay(handleBack)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/receivable-plan/form/index?id=${planId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!planId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该回款计划吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteReceivablePlan(planId.value)
    toast.success('删除成功')
    uni.$emit('crm:receivablePlan:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:receivablePlan:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:receivablePlan:reload', getDetail)
})
</script>
