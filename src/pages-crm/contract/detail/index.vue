<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': isPagingTab }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="合同详情"
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
    <template v-if="activeTab === 'basic'">
      <wd-cell-group border>
        <wd-cell title="合同编号" :value="formData.no || '-'" />
        <wd-cell title="合同名称" :value="formData.name || '-'" />
        <wd-cell title="客户名称" :value="formData.customerName || '-'" />
        <wd-cell title="商机名称" :value="formData.businessName || '-'" />
        <wd-cell title="负责人" :value="formData.ownerUserName || '-'" />
        <wd-cell title="下单日期" :value="formatDate(formData.orderDate) || '-'" />
        <wd-cell title="开始时间" :value="formatDate(formData.startTime) || '-'" />
        <wd-cell title="结束时间" :value="formatDate(formData.endTime) || '-'" />
        <wd-cell title="公司签约人" :value="formData.signUserName || '-'" />
        <wd-cell title="客户签约人" :value="formData.signContactName || '-'" />
        <wd-cell title="审批状态">
          <dict-tag v-if="formData.auditStatus != null && formData.auditStatus !== ''" :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="formData.auditStatus" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="合同金额" :value="formatMoney(formData.totalPrice)" />
        <wd-cell title="整单折扣(%)" :value="formData.discountPercent != null ? formData.discountPercent : '-'" />
        <wd-cell title="已回款金额" :value="formatMoney(formData.totalReceivablePrice)" />
        <wd-cell title="最后跟进时间" :value="formatDateTime(formData.contactLastTime) || '-'" />
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="创建人" :value="formData.creatorName || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
        <wd-cell title="更新时间" :value="formatDateTime(formData.updateTime) || '-'" />
      </wd-cell-group>

      <!-- 产品清单（只读） -->
      <view class="mt-24rpx bg-white">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-30rpx text-[#333] font-semibold">产品清单</text>
        </view>
        <view v-for="(row, index) in products" :key="index" class="mx-24rpx mb-20rpx rounded-12rpx bg-[#f7f8fa] p-24rpx">
          <view class="mb-12rpx text-28rpx text-[#333] font-semibold">
            {{ row.productName || '-' }}
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">产品编码：</text>
            <text class="line-clamp-1">{{ row.productNo || '-' }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">产品单位：</text>
            <text class="line-clamp-1">{{ getDictLabel(DICT_TYPE.CRM_PRODUCT_UNIT, row.productUnit) || '-' }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">产品价格：</text>
            <text class="line-clamp-1">{{ formatMoney(row.productPrice) }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">数量：</text>
            <text class="line-clamp-1">{{ row.count ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">合同价：</text>
            <text class="line-clamp-1">{{ formatMoney(row.contractPrice) }}</text>
          </view>
          <view class="flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">合计：</text>
            <text class="line-clamp-1">{{ formatMoney(row.totalPrice) }}</text>
          </view>
        </view>
        <wd-empty v-if="products.length === 0" icon="content" tip="暂无产品" />
        <view v-else class="border-t border-[#f5f5f5] px-24rpx py-20rpx">
          <view class="flex items-center justify-between text-28rpx">
            <text class="text-[#999]">产品总金额</text>
            <text class="text-[#333]">{{ formatMoney(totalProductPrice) }}</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 跟进记录 -->
    <CrmFollowupRecords v-else-if="activeTab === 'followup' && contractId" ref="followupRef" class="min-h-0 flex-1" embedded :biz-id="contractId" :biz-type="bizType" />

    <!-- 回款计划 -->
    <ReceivablePlanList v-else-if="activeTab === 'plans' && contractId" ref="listRef" class="min-h-0 flex-1" :customer-id="formData.customerId" :contract-id="contractId" />

    <!-- 回款 -->
    <ReceivableList v-else-if="activeTab === 'receivables' && contractId" ref="listRef" class="min-h-0 flex-1" :customer-id="formData.customerId" :contract-id="contractId" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && contractId" class="min-h-0 flex-1" :biz-id="contractId" :biz-type="bizType" />

    <!-- 团队成员（常驻挂载：底部业务操作需读取其权限校验） -->
    <CrmPermissionTeam
      v-if="contractId"
      v-show="activeTab === 'team'"
      ref="teamRef"
      embedded
      :biz-id="contractId"
      :biz-type="bizType"
      @quit-team="handleQuitTeam"
      @can-quit-change="(v: boolean) => teamCanQuit = v"
    />

    <!-- 底部操作（按 tab 区分，只放当前模块的操作） -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'basic'">
          <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="hasAccessByCodes(['crm:contract:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
          <wd-button v-if="moreActions.length" class="flex-1" type="info" @click="moreActionVisible = true">
            更多
          </wd-button>
        </template>
        <wd-button v-else-if="activeTab === 'followup'" class="flex-1" type="primary" @click="followupRef?.openAdd()">
          写跟进
        </wd-button>
        <template v-else-if="activeTab === 'team'">
          <wd-button v-if="teamCanQuit" class="flex-1" type="danger" variant="plain" @click="teamRef?.quit()">
            退出团队
          </wd-button>
          <wd-button v-if="validateOwnerUser" class="flex-1" type="primary" @click="teamRef?.openAdd()">
            新增成员
          </wd-button>
        </template>
        <wd-button v-else-if="activeTab === 'plans' && hasAccessByCodes(['crm:receivable-plan:create'])" class="flex-1" type="primary" @click="listRef?.openAdd()">
          新增回款计划
        </wd-button>
        <wd-button v-else-if="activeTab === 'receivables' && hasAccessByCodes(['crm:receivable:create'])" class="flex-1" type="primary" @click="listRef?.openAdd()">
          新增回款
        </wd-button>
      </view>
    </view>

    <!-- 业务操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />

    <!-- 转移 -->
    <CrmTransferForm ref="transferFormRef" :biz-type="bizType" @success="handleTransferSuccess" />
  </view>
</template>

<script lang="ts" setup>
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteContract, getContract, submitContract } from '@/api/crm/contract'
import { BizTypeEnum, CrmAuditStatusEnum } from '@/api/crm/permission'
import { getDictLabel } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/format'
import CrmFollowupRecords from '@/pages-crm/followup/components/followup-list.vue'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'
import CrmPermissionTeam from '@/pages-crm/permission/components/permission-list.vue'
import CrmTransferForm from '@/pages-crm/permission/components/transfer-form.vue'
import ReceivableList from '@/pages-crm/receivable/components/receivable-list.vue'
import ReceivablePlanList from '@/pages-crm/receivable-plan/components/receivable-plan-list.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_CONTRACT
const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
  { key: 'followup', title: '跟进记录' },
  { key: 'plans', title: '回款计划' },
  { key: 'receivables', title: '回款' },
  { key: 'team', title: '团队成员' },
  { key: 'log', title: '操作日志' },
] // tab 配置

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Record<string, any>>({}) // 详情数据
const tabIndex = ref(0) // 当前详情分类下标
const deleting = ref(false) // 删除状态
const actionLoading = ref(false) // 业务操作状态
const moreActionVisible = ref(false) // 业务操作菜单显示状态
const teamCanQuit = ref(false) // 是否可退出团队
const followupRef = ref<{ openAdd: () => void }>() // 跟进记录引用
const teamRef = ref<{ openAdd: () => void, quit: () => void, validateWrite: boolean, validateOwnerUser: boolean }>() // 团队成员引用（含权限校验）
const listRef = ref<{ openAdd: () => void }>() // 当前关联列表引用
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 转移表单引用
const contractId = computed(() => props.id)
const products = computed<Record<string, any>[]>(() => Array.isArray(formData.value.products) ? formData.value.products : [])
const totalProductPrice = computed(() => products.value.reduce((sum, row) => sum + Number(row.totalPrice || 0), 0)) // 产品总金额
const activeTab = computed(() => tabs[tabIndex.value].key)
const isPagingTab = computed(() => ['plans', 'receivables', 'followup', 'log'].includes(activeTab.value)) // 关系列表/跟进 tab 用 z-paging 固定高布局
const isDraft = computed(() => Number(formData.value.auditStatus) === CrmAuditStatusEnum.DRAFT) // 未提交（草稿）
const validateWrite = computed(() => teamRef.value?.validateWrite ?? false) // 读写权限（负责人或读写成员）
const validateOwnerUser = computed(() => teamRef.value?.validateOwnerUser ?? false) // 负责人权限
const canEdit = computed(() => hasAccessByCodes(['crm:contract:update']) && isDraft.value && validateWrite.value) // 可编辑（草稿 + 菜单权限 + 读写权限）
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions: { name: string, value: string }[] = []
  if (validateOwnerUser.value) {
    actions.push({ name: '转移', value: 'transfer' })
  }
  if (hasAccessByCodes(['crm:contract:update'])) {
    if (isDraft.value) {
      actions.push({ name: '提交审核', value: 'submit' })
    } else {
      actions.push({ name: '查看审批', value: 'viewProcess' })
    }
  }
  return actions
})
const hasFooter = computed(() => {
  switch (activeTab.value) {
    case 'log':
      return false
    case 'basic':
      return canEdit.value || hasAccessByCodes(['crm:contract:delete']) || moreActions.value.length > 0
    case 'followup':
      return true
    case 'team':
      return teamCanQuit.value || validateOwnerUser.value
    case 'plans':
      return hasAccessByCodes(['crm:receivable-plan:create'])
    case 'receivables':
      return hasAccessByCodes(['crm:receivable:create'])
    default:
      return false
  }
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/contract/index')
}

/** 加载详情 */
async function getDetail() {
  if (!contractId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getContract(contractId.value)
  } finally {
    toast.close()
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    transfer: handleTransfer,
    submit: handleSubmit,
    viewProcess: handleViewProcess,
  }
  handlers[item.value]?.()
}

/** 转移 */
function handleTransfer() {
  transferFormRef.value?.open(contractId.value)
}

/** 提交审核 */
async function handleSubmit() {
  try {
    await dialog.confirm({ title: '提示', msg: `确定提交合同【${formData.value.name || formData.value.no || ''}】审核吗？` })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await submitContract(contractId.value)
    toast.success('提交审核成功')
    uni.$emit('crm:contract:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 查看审批 */
function handleViewProcess() {
  const processInstanceId = formData.value.processInstanceId
  if (!processInstanceId) {
    toast.show('暂无审批流程')
    return
  }
  uni.navigateTo({ url: `/pages-bpm/processInstance/detail/index?id=${processInstanceId}` })
}

/** 转移成功后刷新列表并返回 */
function handleTransferSuccess() {
  uni.$off('crm:contract:reload', getDetail)
  uni.$emit('crm:contract:reload')
  delay(handleBack)
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:contract:reload')
  delay(handleBack)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/contract/form/index?id=${contractId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!contractId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该合同吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteContract(contractId.value)
    toast.success('删除成功')
    uni.$emit('crm:contract:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:contract:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:contract:reload', getDetail)
})
</script>
