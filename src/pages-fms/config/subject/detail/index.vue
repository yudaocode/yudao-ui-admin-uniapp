<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="科目详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="科目编码" :value="formData.code || '-'" />
        <wd-cell title="科目名称" :value="formData.name || '-'" />
        <wd-cell title="上级科目" :value="getParentLabel()" />
        <wd-cell title="科目类别">
          <dict-tag
            v-if="formData.type != null && formData.category != null"
            :type="DICT_TYPE.FMS_SUBJECT_CATEGORY"
            :value="`${formData.type}-${formData.category}`"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="余额方向">
          <dict-tag
            v-if="formData.balanceDirection != null"
            :type="DICT_TYPE.FMS_DEBIT_CREDIT_DIRECTION"
            :value="formData.balanceDirection"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="辅助核算" :value="formData.auxiliaryTypeNames?.length ? formData.auxiliaryTypeNames.join('、') : '无'" />
        <wd-cell title="外币核算" :value="getCurrencyLabel()" />
        <wd-cell title="数量核算" :value="formData.quantityAccounting ? `启用（${formData.quantityUnit || '-'}）` : '不启用'" />
        <wd-cell title="现金项" :value="formData.cash ? '是' : '否'" />
        <wd-cell title="状态">
          <wd-tag :type="formData.status === FmsSubjectStatus.ENABLED ? 'success' : 'danger'" plain>
            {{ formData.status === FmsSubjectStatus.ENABLED ? '启用' : '停用' }}
          </wd-tag>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="canEdit || canDelete || (fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:subject:create']))" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canEdit" class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button
          v-if="canEdit"
          class="flex-1"
          type="warning"
          :loading="statusUpdating"
          @click="handleStatusChange"
        >
          {{ formData.status === FmsSubjectStatus.ENABLED ? '停用' : '启用' }}
        </wd-button>
        <wd-button
          v-if="fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:subject:create'])"
          class="flex-1"
          type="primary"
          variant="plain"
          @click="handleAddChild"
        >
          新建下级
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Currency } from '@/api/fms/config/currency'
import type { Subject } from '@/api/fms/config/subject'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { getCurrencyList } from '@/api/fms/config/currency'
import {
  deleteSubjectList,
  getSubject,
  getSubjectList,
  updateSubjectStatus,
} from '@/api/fms/config/subject'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FMS_SUBJECT_PARENT_ID_ROOT, FmsSubjectStatus } from '@/pages-fms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const fmsStore = useFmsStore()
const formData = ref<Subject>({} as Subject) // 详情数据
const deleting = ref(false) // 删除状态
const statusUpdating = ref(false) // 状态修改状态
const subjectList = ref<Subject[]>([]) // 同类科目列表，用于上级科目名称
const currencyList = ref<Currency[]>([]) // 币别列表，用于外币核算名称

const canEdit = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:subject:update'])) // 仅账套可写且有权限时可编辑
const canDelete = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:subject:delete'])) // 仅账套可写且有权限时可删除；有下级或已被业务使用时由后端校验拦截

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/subject/index')
}

/** 获取上级科目名称 */
function getParentLabel(): string {
  if (!formData.value.parentId || formData.value.parentId === FMS_SUBJECT_PARENT_ID_ROOT) {
    return '无上级科目'
  }
  const parent = subjectList.value.find(item => item.id === formData.value.parentId)
  return parent ? `${parent.code} ${parent.name}` : '未知'
}

/** 获取外币核算名称 */
function getCurrencyLabel(): string {
  if (!formData.value.currencyIds?.length) {
    return '无'
  }
  const names = formData.value.currencyIds.map((id) => {
    const currency = currencyList.value.find(item => item.id === id)
    return currency ? `${currency.code} ${currency.name}` : ''
  }).filter(Boolean)
  return names.length ? names.join('、') : '无'
}

/** 加载科目详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  formData.value = await getSubject(accountSetId, Number(props.id))
}

/** 编辑科目 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/config/subject/form/index?id=${props.id}` })
}

/** 新建下级科目 */
function handleAddChild() {
  uni.navigateTo({
    url: `/pages-fms/config/subject/form/index?parentId=${formData.value.id}&type=${formData.value.type}`,
  })
}

/** 启用 / 停用科目 */
async function handleStatusChange() {
  if (!props.id || !formData.value.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const status = formData.value.status === FmsSubjectStatus.ENABLED
    ? FmsSubjectStatus.DISABLED
    : FmsSubjectStatus.ENABLED
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认${status === FmsSubjectStatus.ENABLED ? '启用' : '停用'}科目“${formData.value.code} ${formData.value.name}”吗？`,
    })
  } catch {
    return
  }
  statusUpdating.value = true
  try {
    await updateSubjectStatus(accountSetId, [Number(props.id)], status)
    toast.success(status === FmsSubjectStatus.ENABLED ? '启用成功' : '停用成功')
    uni.$emit('fms:config:subject:reload')
    await getDetail()
  } finally {
    statusUpdating.value = false
  }
}

/** 删除科目 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除科目“${formData.value.code} ${formData.value.name}”吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteSubjectList(accountSetId, [Number(props.id)])
    toast.success('删除成功')
    uni.$emit('fms:config:subject:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getDetail()
  // 加载同类科目和币别，用于上级科目与外币核算名称展示
  const accountSetId = fmsStore.accountSet?.id
  if (accountSetId && formData.value.id) {
    const [subjects, currencies] = await Promise.all([
      getSubjectList(accountSetId, formData.value.type),
      getCurrencyList(accountSetId),
    ])
    subjectList.value = subjects
    currencyList.value = currencies
  }
  uni.$on('fms:config:subject:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:subject:reload', getDetail)
})
</script>
