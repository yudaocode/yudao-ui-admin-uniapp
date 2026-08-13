<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="财务指标详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="指标名称" :value="formData.name || '-'" />
        <wd-cell title="指标编码" :value="formData.code || '-'" />
        <wd-cell title="取数报表" :value="formatFmsFinanceIndicatorType(formData.type)" />
        <wd-cell title="指标公式" :value="formData.formula || '-'" />
        <wd-cell title="展示顺序" :value="`${formData.sort ?? '-'}`" />
        <wd-cell title="状态">
          <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="canEdit || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canEdit" class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="error" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FinanceIndicator } from '@/api/fms/config/finance-indicator'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteFinanceIndicator, getFinanceIndicator } from '@/api/fms/config/finance-indicator'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { formatFmsFinanceIndicatorType } from '@/pages-fms/utils/format'
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
const formData = ref<FinanceIndicator>({} as FinanceIndicator) // 详情数据
const deleting = ref(false) // 删除状态

/** 仅账套可写且有权限时可编辑 */
const canEdit = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:finance-indicator:update']))
/** 仅账套可写且有权限时可删除 */
const canDelete = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:finance-indicator:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/finance-indicator/index')
}

/** 加载财务指标详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  formData.value = await getFinanceIndicator(accountSetId, Number(props.id))
}

/** 编辑财务指标 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/config/finance-indicator/form/index?id=${props.id}` })
}

/** 删除财务指标 */
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
      msg: `是否确认删除财务指标“${formData.value.name}”？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteFinanceIndicator(accountSetId, Number(props.id))
    toast.success('删除成功')
    uni.$emit('fms:config:finance-indicator:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getDetail()
})
</script>
