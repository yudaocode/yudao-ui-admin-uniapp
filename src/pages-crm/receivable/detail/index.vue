<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': isPagingTab }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="回款详情"
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
      <wd-cell title="回款编号" :value="formData.no || '-'" />
      <wd-cell title="客户名称" :value="formData.customerName || '-'" />
      <wd-cell title="合同编号" :value="formData.contract?.no || '-'" />
      <wd-cell title="合同金额" :value="formatMoney(formData.contract?.totalPrice)" />
      <wd-cell title="回款方式">
        <dict-tag v-if="formData.returnType != null && formData.returnType !== ''" :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE" :value="formData.returnType" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="回款金额" :value="formatMoney(formData.price)" />
      <wd-cell title="回款日期" :value="formatDate(formData.returnTime) || '-'" />
      <wd-cell title="负责人" :value="formData.ownerUserName || '-'" />
      <wd-cell title="审批状态">
        <dict-tag v-if="formData.auditStatus != null && formData.auditStatus !== ''" :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="formData.auditStatus" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="备注" :value="formData.remark || '-'" />
      <wd-cell title="创建人" :value="formData.creatorName || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      <wd-cell title="更新时间" :value="formatDateTime(formData.updateTime) || '-'" />
    </wd-cell-group>

    <!-- 团队成员（常驻挂载：底部业务操作需读取其权限校验） -->
    <CrmPermissionTeam
      v-if="receivableId"
      v-show="activeTab === 'team'"
      ref="teamRef"
      embedded
      :biz-id="receivableId"
      :biz-type="bizType"
      @quit-team="handleQuitTeam"
      @can-quit-change="(v: boolean) => teamCanQuit = v"
    />

    <!-- 操作日志 -->
    <CrmOperateLogs v-if="activeTab === 'log' && receivableId" class="min-h-0 flex-1" :biz-id="receivableId" :biz-type="bizType" />

    <!-- 底部操作（按 tab 区分，只放当前模块的操作） -->
    <view v-if="hasFooter" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <template v-if="activeTab === 'basic'">
          <wd-button v-if="canEdit" class="flex-1" type="warning" @click="handleEdit">
            编辑
          </wd-button>
          <wd-button v-if="hasAccessByCodes(['crm:receivable:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
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
import { deleteReceivable, getReceivable, submitReceivable } from '@/api/crm/receivable'
import { BizTypeEnum, CrmAuditStatusEnum } from '@/api/crm/permission'
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

const bizType = BizTypeEnum.CRM_RECEIVABLE
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
const actionLoading = ref(false) // 业务操作状态
const moreActionVisible = ref(false) // 业务操作菜单显示状态
const teamCanQuit = ref(false) // 是否可退出团队
const teamRef = ref<{ openAdd: () => void, quit: () => void, validateWrite: boolean, validateOwnerUser: boolean }>() // 团队成员引用（含权限校验）
const receivableId = computed(() => props.id)
const activeTab = computed(() => tabs[tabIndex.value].key)
const isPagingTab = computed(() => activeTab.value === 'log') // 操作日志 tab 用 z-paging 固定高布局
const validateWrite = computed(() => teamRef.value?.validateWrite ?? false) // 读写权限（负责人或读写成员）
const validateOwnerUser = computed(() => teamRef.value?.validateOwnerUser ?? false) // 负责人权限
const canEdit = computed(() => hasAccessByCodes(['crm:receivable:update']) && validateWrite.value) // 可编辑（菜单权限 + 读写权限）
const isDraft = computed(() => Number(formData.value.auditStatus) === CrmAuditStatusEnum.DRAFT) // 未提交（草稿）
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id || !hasAccessByCodes(['crm:receivable:update'])) {
    return []
  }
  const actions: { name: string, value: string }[] = []
  if (isDraft.value) {
    actions.push({ name: '提交审核', value: 'submit' })
  } else {
    actions.push({ name: '查看审批', value: 'viewProcess' })
  }
  return actions
})
const hasFooter = computed(() => {
  switch (activeTab.value) {
    case 'log':
      return false
    case 'basic':
      return canEdit.value || hasAccessByCodes(['crm:receivable:delete']) || moreActions.value.length > 0
    case 'team':
      return teamCanQuit.value || validateOwnerUser.value
    default:
      return false
  }
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/receivable/index')
}

/** 加载详情 */
async function getDetail() {
  if (!receivableId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getReceivable(receivableId.value)
  } finally {
    toast.close()
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    submit: handleSubmitAudit,
    viewProcess: handleViewProcess,
  }
  handlers[item.value]?.()
}

/** 提交审核 */
async function handleSubmitAudit() {
  try {
    await dialog.confirm({ title: '提示', msg: `确定提交回款【${formData.value.no || ''}】审核吗？` })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await submitReceivable(receivableId.value)
    toast.success('提交审核成功')
    uni.$emit('crm:receivable:reload')
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

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:receivable:reload')
  delay(handleBack)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/receivable/form/index?id=${receivableId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!receivableId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该回款吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteReceivable(receivableId.value)
    toast.success('删除成功')
    uni.$emit('crm:receivable:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:receivable:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:receivable:reload', getDetail)
})
</script>
