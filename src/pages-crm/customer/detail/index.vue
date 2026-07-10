<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': isPagingTab }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="客户详情"
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
      <wd-cell title="客户名称" :value="formData.name || '-'" />
      <wd-cell title="客户来源">
        <dict-tag v-if="formData.source != null && formData.source !== ''" :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="formData.source" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="手机" :value="formData.mobile || '-'" />
      <wd-cell title="负责人" :value="formData.ownerUserName || '-'" />
      <wd-cell title="电话" :value="formData.telephone || '-'" />
      <wd-cell title="邮箱" :value="formData.email || '-'" />
      <wd-cell title="微信" :value="formData.wechat || '-'" />
      <wd-cell title="QQ" :value="formData.qq || '-'" />
      <wd-cell title="客户行业">
        <dict-tag v-if="formData.industryId != null && formData.industryId !== ''" :type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" :value="formData.industryId" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="客户级别">
        <dict-tag v-if="formData.level != null && formData.level !== ''" :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="formData.level" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="地区" :value="formData.areaName || '-'" />
      <wd-cell title="详细地址" :value="formData.detailAddress || '-'" />
      <wd-cell title="下次联系时间" :value="formatDateTime(formData.contactNextTime) || '-'" />
      <wd-cell title="最后跟进时间" :value="formatDateTime(formData.contactLastTime) || '-'" />
      <wd-cell title="最后跟进内容" :value="formData.contactLastContent || '-'" />
      <wd-cell title="备注" :value="formData.remark || '-'" />
      <wd-cell title="创建人" :value="formData.creatorName || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      <wd-cell title="更新时间" :value="formatDateTime(formData.updateTime) || '-'" />
      <wd-cell title="锁定状态" :value="formData.lockStatus ? '是' : '否'" />
      <wd-cell title="成交状态" :value="formData.dealStatus ? '是' : '否'" />
    </wd-cell-group>

    <!-- 跟进记录 -->
    <CrmFollowupRecords v-else-if="activeTab === 'followup' && customerId" ref="followupRef" class="min-h-0 flex-1" embedded :biz-id="customerId" :biz-type="bizType" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && customerId" class="min-h-0 flex-1" :biz-id="customerId" :biz-type="bizType" />

    <!-- 关联数据：各模块自己的列表组件 -->
    <ContactList v-else-if="activeTab === 'contacts' && customerId" ref="listRef" class="min-h-0 flex-1" :customer-id="customerId" />
    <BusinessList v-else-if="activeTab === 'businesses' && customerId" ref="listRef" class="min-h-0 flex-1" :customer-id="customerId" />
    <ContractList v-else-if="activeTab === 'contracts' && customerId" ref="listRef" class="min-h-0 flex-1" :customer-id="customerId" />
    <ReceivablePlanList v-else-if="activeTab === 'plans' && customerId" ref="listRef" class="min-h-0 flex-1" :customer-id="customerId" />
    <ReceivableList v-else-if="activeTab === 'receivables' && customerId" ref="listRef" class="min-h-0 flex-1" :customer-id="customerId" />

    <!-- 团队成员（常驻挂载：底部业务操作需读取其权限校验） -->
    <CrmPermissionTeam
      v-if="customerId"
      v-show="activeTab === 'team'"
      ref="teamRef"
      embedded
      :biz-id="customerId"
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
          <wd-button v-if="hasAccessByCodes(['crm:customer:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
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
        <wd-button v-else-if="activeTabConfig.addPermission && hasAccessByCodes([activeTabConfig.addPermission])" class="flex-1" type="primary" @click="listRef?.openAdd()">
          {{ activeTabConfig.addLabel }}
        </wd-button>
      </view>
    </view>

    <!-- 业务操作菜单 -->
    <wd-action-sheet v-model="moreActionVisible" :actions="moreActions" @select="handleMoreAction" />

    <!-- 转移 -->
    <CrmTransferForm ref="transferFormRef" :biz-type="bizType" @success="getDetail" />

    <!-- 公海分配 -->
    <wd-popup v-model="distributeVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="bg-white pb-32rpx">
        <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-24rpx">
          <view class="text-32rpx text-[#333] font-semibold">
            分配客户
          </view>
          <wd-icon name="close" size="36rpx" @click="distributeVisible = false" />
        </view>
        <wd-form ref="distributeFormRef" :model="distributeFormData" :schema="distributeFormSchema">
          <wd-cell-group border>
            <UserFormPicker v-model="distributeFormData.ownerUserId" label="负责人" label-width="220rpx" prop="ownerUserId" placeholder="请选择负责人" />
          </wd-cell-group>
        </wd-form>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="actionLoading" @click="handleDistributeSubmit">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteCustomer, distributeCustomer, getCustomer, lockCustomer, putCustomerPool, receiveCustomer, updateCustomerDealStatus } from '@/api/crm/customer'
import { BizTypeEnum } from '@/api/crm/permission'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import BusinessList from '@/pages-crm/business/components/business-list.vue'
import ContactList from '@/pages-crm/contact/components/contact-list.vue'
import ContractList from '@/pages-crm/contract/components/contract-list.vue'
import ReceivableList from '@/pages-crm/receivable/components/receivable-list.vue'
import ReceivablePlanList from '@/pages-crm/receivable-plan/components/receivable-plan-list.vue'
import CrmFollowupRecords from '@/pages-crm/followup/components/followup-list.vue'
import CrmOperateLogs from '@/pages-crm/operate-log/components/operate-log-list.vue'
import CrmPermissionTeam from '@/pages-crm/permission/components/permission-list.vue'
import CrmTransferForm from '@/pages-crm/permission/components/transfer-form.vue'

const props = defineProps<{ id?: number | any }>()
definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const bizType = BizTypeEnum.CRM_CUSTOMER
const tabs: { key: string, title: string, addLabel?: string, addPermission?: string }[] = [
  { key: 'basic', title: '基本信息' },
  { key: 'followup', title: '跟进记录' },
  { key: 'contacts', title: '联系人', addLabel: '新增联系人', addPermission: 'crm:contact:create' },
  { key: 'businesses', title: '商机', addLabel: '新增商机', addPermission: 'crm:business:create' },
  { key: 'contracts', title: '合同', addLabel: '新增合同', addPermission: 'crm:contract:create' },
  { key: 'plans', title: '回款计划', addLabel: '新增回款计划', addPermission: 'crm:receivable-plan:create' },
  { key: 'receivables', title: '回款', addLabel: '新增回款', addPermission: 'crm:receivable:create' },
  { key: 'team', title: '团队成员' },
  { key: 'log', title: '操作日志' },
] // tab 配置；关联 tab 带「新增」标签与权限（底部操作用）

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
const distributeVisible = ref(false) // 分配弹窗显示状态
const distributeFormRef = ref<FormInstance>() // 分配表单引用
const distributeFormData = ref({ ownerUserId: undefined as number | undefined }) // 分配表单数据
const distributeFormSchema = createFormSchema({ ownerUserId: [{ required: true, message: '负责人不能为空' }] })
const customerId = computed(() => Number(props.id))
const activeTabConfig = computed(() => tabs[tabIndex.value])
const activeTab = computed(() => activeTabConfig.value.key)
const isPagingTab = computed(() => ['contacts', 'businesses', 'contracts', 'plans', 'receivables', 'followup', 'log'].includes(activeTab.value)) // 关系列表/跟进 tab 用 z-paging 固定高布局
const validateWrite = computed(() => teamRef.value?.validateWrite ?? false) // 读写权限（负责人或读写成员）
const validateOwnerUser = computed(() => teamRef.value?.validateOwnerUser ?? false) // 负责人权限
const canEdit = computed(() => hasAccessByCodes(['crm:customer:update']) && validateWrite.value) // 可编辑（菜单权限 + 读写权限）
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions: { name: string, value: string }[] = []
  if (validateOwnerUser.value) {
    actions.push({ name: '转移', value: 'transfer' })
  }
  if (validateWrite.value) {
    actions.push({ name: data.dealStatus ? '标记未成交' : '标记已成交', value: 'deal' })
  }
  if (validateOwnerUser.value) {
    actions.push({ name: data.lockStatus ? '解锁客户' : '锁定客户', value: 'lock' })
  }
  if (!data.ownerUserId) {
    actions.push({ name: '领取', value: 'receive' })
    actions.push({ name: '分配', value: 'distribute' })
  } else if (validateOwnerUser.value) {
    actions.push({ name: '放入公海', value: 'putPool' })
  }
  return actions
})
const hasFooter = computed(() => {
  switch (activeTab.value) {
    case 'log':
      return false
    case 'basic':
      return canEdit.value || hasAccessByCodes(['crm:customer:delete']) || moreActions.value.length > 0
    case 'followup':
      return true
    case 'team':
      return teamCanQuit.value || validateOwnerUser.value
    default:
      return !!activeTabConfig.value.addPermission && hasAccessByCodes([activeTabConfig.value.addPermission])
  }
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/customer/index')
}

/** 加载详情 */
async function getDetail() {
  if (!customerId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getCustomer(customerId.value)
  } finally {
    toast.close()
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    transfer: handleTransfer,
    deal: handleUpdateDealStatus,
    lock: handleToggleLock,
    receive: handleReceive,
    distribute: handleDistribute,
    putPool: handlePutPool,
  }
  handlers[item.value]?.()
}

/** 转移 */
function handleTransfer() {
  transferFormRef.value?.open(customerId.value)
}

/** 更新成交状态 */
async function handleUpdateDealStatus() {
  const nextStatus = !formData.value.dealStatus
  try {
    await dialog.confirm({ title: '提示', msg: `确定更新成交状态为【${nextStatus ? '已成交' : '未成交'}】吗？` })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await updateCustomerDealStatus(customerId.value, nextStatus)
    toast.success('更新成交状态成功')
    uni.$emit('crm:customer:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 锁定或解锁客户 */
async function handleToggleLock() {
  const nextStatus = !formData.value.lockStatus
  try {
    await dialog.confirm({ title: '提示', msg: `确定${nextStatus ? '锁定' : '解锁'}客户【${formData.value.name || ''}】吗？` })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await lockCustomer(customerId.value, nextStatus)
    toast.success(`${nextStatus ? '锁定' : '解锁'}成功`)
    uni.$emit('crm:customer:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 领取客户 */
async function handleReceive() {
  try {
    await dialog.confirm({ title: '提示', msg: `确定领取客户【${formData.value.name || ''}】吗？` })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await receiveCustomer([customerId.value])
    toast.success('领取成功')
    uni.$emit('crm:customer:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 打开分配客户弹窗 */
function handleDistribute() {
  distributeFormData.value.ownerUserId = undefined
  distributeVisible.value = true
}

/** 提交分配客户 */
async function handleDistributeSubmit() {
  const { valid } = await distributeFormRef.value.validate()
  if (!valid || !distributeFormData.value.ownerUserId) {
    return
  }
  actionLoading.value = true
  try {
    await distributeCustomer([customerId.value], distributeFormData.value.ownerUserId)
    toast.success('分配成功')
    distributeVisible.value = false
    uni.$emit('crm:customer:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 放入公海 */
async function handlePutPool() {
  try {
    await dialog.confirm({ title: '提示', msg: `确定将客户【${formData.value.name || ''}】放入公海吗？` })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await putCustomerPool(customerId.value)
    toast.success('放入公海成功')
    uni.$emit('crm:customer:reload')
    delay(handleBack)
  } finally {
    actionLoading.value = false
  }
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:customer:reload')
  delay(handleBack)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/customer/form/index?id=${customerId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!customerId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该客户吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteCustomer(customerId.value)
    toast.success('删除成功')
    uni.$emit('crm:customer:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:customer:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:customer:reload', getDetail)
})
</script>
