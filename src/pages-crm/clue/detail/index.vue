<template>
  <view class="yd-page-container" :class="{ 'yd-page-container-paging': isPagingTab }">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="线索详情"
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
      <wd-cell title="线索名称" :value="formData.name || '-'" />
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
      <wd-cell title="转化状态">
        <dict-tag v-if="formData.transformStatus != null && formData.transformStatus !== ''" :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData.transformStatus" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="转化客户" :value="formData.customerName || '-'" />
    </wd-cell-group>

    <!-- 跟进记录 -->
    <CrmFollowupRecords v-else-if="activeTab === 'followup' && clueId" ref="followupRef" class="min-h-0 flex-1" embedded :biz-id="clueId" :biz-type="bizType" />

    <!-- 操作日志 -->
    <CrmOperateLogs v-else-if="activeTab === 'log' && clueId" class="min-h-0 flex-1" :biz-id="clueId" :biz-type="bizType" />

    <!-- 团队成员（常驻挂载：底部业务操作需读取其权限校验） -->
    <CrmPermissionTeam
      v-if="clueId"
      v-show="activeTab === 'team'"
      ref="teamRef"
      embedded
      :biz-id="clueId"
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
          <wd-button v-if="hasAccessByCodes(['crm:clue:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
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
import { deleteClue, getClue, transformClue } from '@/api/crm/clue'
import { BizTypeEnum } from '@/api/crm/permission'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
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

const bizType = BizTypeEnum.CRM_CLUE
const tabs: { key: string, title: string }[] = [
  { key: 'basic', title: '基本信息' },
  { key: 'followup', title: '跟进记录' },
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
const followupRef = ref<{ openAdd: () => void }>() // 跟进记录引用
const teamRef = ref<{ openAdd: () => void, quit: () => void, validateWrite: boolean, validateOwnerUser: boolean }>() // 团队成员引用（含权限校验）
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 转移表单引用
const clueId = computed(() => props.id)
const activeTab = computed(() => tabs[tabIndex.value].key)
const isPagingTab = computed(() => ['followup', 'log'].includes(activeTab.value)) // 跟进/操作日志 tab 用 z-paging 固定高布局
const validateWrite = computed(() => teamRef.value?.validateWrite ?? false) // 读写权限（负责人或读写成员）
const validateOwnerUser = computed(() => teamRef.value?.validateOwnerUser ?? false) // 负责人权限
const canEdit = computed(() => hasAccessByCodes(['crm:clue:update']) && validateWrite.value) // 可编辑（菜单权限 + 读写权限）
const moreActions = computed(() => {
  const data = formData.value
  if (!data?.id) {
    return []
  }
  const actions: { name: string, value: string }[] = []
  if (validateOwnerUser.value) {
    actions.push({ name: '转移', value: 'transfer' })
  }
  // 已转化的线索不再展示「转化为客户」
  if (validateOwnerUser.value && !data.transformStatus) {
    actions.push({ name: '转化为客户', value: 'transform' })
  }
  return actions
})
const hasFooter = computed(() => {
  switch (activeTab.value) {
    case 'log':
      return false
    case 'basic':
      return canEdit.value || hasAccessByCodes(['crm:clue:delete']) || moreActions.value.length > 0
    case 'followup':
      return true
    case 'team':
      return teamCanQuit.value || validateOwnerUser.value
    default:
      return false
  }
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-crm/clue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!clueId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getClue(clueId.value)
  } finally {
    toast.close()
  }
}

/** 业务操作菜单选择 */
function handleMoreAction({ item }: { item: { value: string } }) {
  const handlers: Record<string, () => void> = {
    transfer: handleTransfer,
    transform: handleTransform,
  }
  handlers[item.value]?.()
}

/** 转移 */
function handleTransfer() {
  transferFormRef.value?.open(clueId.value)
}

/** 转化为客户 */
async function handleTransform() {
  try {
    await dialog.confirm({ title: '提示', msg: `确定将线索【${formData.value.name || ''}】转化为客户吗？` })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await transformClue(clueId.value)
    toast.success('转化成功')
    uni.$emit('crm:clue:reload')
    await getDetail()
  } finally {
    actionLoading.value = false
  }
}

/** 转移成功后刷新列表并返回 */
function handleTransferSuccess() {
  uni.$off('crm:clue:reload', getDetail)
  uni.$emit('crm:clue:reload')
  delay(handleBack)
}

/** 退出团队后返回 */
function handleQuitTeam() {
  uni.$emit('crm:clue:reload')
  delay(handleBack)
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-crm/clue/form/index?id=${clueId.value}` })
}

/** 删除 */
async function handleDelete() {
  if (!clueId.value) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该线索吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteClue(clueId.value)
    toast.success('删除成功')
    uni.$emit('crm:clue:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
  uni.$on('crm:clue:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('crm:clue:reload', getDetail)
})
</script>
