<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="项目详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="项目编码" :value="formData.code || '-'" />
        <wd-cell title="项目名称" :value="formData.name || '-'" />
        <template v-if="isInventory">
          <wd-cell title="规格" :value="formData.specification || '-'" />
          <wd-cell title="单位" :value="formData.unit || '-'" />
        </template>
        <wd-cell title="备注" :value="formData.remark || '-'" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        </wd-cell>
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="canUpdate || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canUpdate" class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button
          v-if="canUpdate"
          class="flex-1"
          type="warning"
          :loading="statusUpdating"
          @click="handleStatusChange"
        >
          {{ formData.status === CommonStatus.ENABLE ? '停用' : '启用' }}
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="error" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AuxiliaryItem } from '@/api/fms/config/auxiliary/item'
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  deleteAuxiliaryItem,
  getAuxiliaryItemPage,
  updateAuxiliaryItemStatus,
} from '@/api/fms/config/auxiliary/item'
import { getAuxiliaryTypeList } from '@/api/fms/config/auxiliary/type'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsAuxiliaryType } from '@/pages-fms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: number | any
  auxiliaryTypeId?: number | any
  code?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const CommonStatus = { // 通用状态（对齐后端 CommonStatusEnum）
  ENABLE: 0,
  DISABLE: 1,
} as const

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const fmsStore = useFmsStore()
const formData = ref<AuxiliaryItem>({} as AuxiliaryItem) // 详情数据
const auxiliaryType = ref<AuxiliaryType>() // 当前辅助核算类别
const deleting = ref(false) // 删除状态
const statusUpdating = ref(false) // 状态修改状态

const isInventory = computed(() => auxiliaryType.value?.type === FmsAuxiliaryType.INVENTORY) // 是否存货类别
/** 仅账套可写且有更新权限时可编辑、修改状态 */
const canUpdate = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:auxiliary:update']))
/** 仅账套可写且有删除权限时可删除 */
const canDelete = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:auxiliary:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-fms/config/auxiliary/item/index?auxiliaryTypeId=${props.auxiliaryTypeId}`)
}

/** 加载当前类别信息（辅助核算类别无 /get 接口，从账套级列表中查找） */
async function loadAuxiliaryType() {
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !props.auxiliaryTypeId) {
    return
  }
  const typeList = await getAuxiliaryTypeList(accountSetId)
  auxiliaryType.value = typeList.find(item => item.id === Number(props.auxiliaryTypeId))
}

/** 加载项目详情（项目无 /get 接口，通过类别分页 + 编码关键词定位，编码在类别内唯一） */
async function getDetail() {
  if (!props.id || !props.code || deleting.value) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId || !props.auxiliaryTypeId) {
    return
  }
  const data = await getAuxiliaryItemPage({
    accountSetId,
    auxiliaryTypeId: Number(props.auxiliaryTypeId),
    search: props.code,
    pageNo: 1,
    pageSize: 200,
  })
  const auxiliaryItem = data.list.find(item => item.id === Number(props.id))
  if (auxiliaryItem) {
    formData.value = auxiliaryItem
  }
}

/** 编辑项目 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-fms/config/auxiliary/item/form/index?id=${props.id}&auxiliaryTypeId=${props.auxiliaryTypeId}&code=${encodeURIComponent(props.code || '')}`,
  })
}

/** 启用 / 停用项目 */
async function handleStatusChange() {
  if (!props.id || !formData.value.id) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const status = formData.value.status === CommonStatus.ENABLE ? CommonStatus.DISABLE : CommonStatus.ENABLE
  try {
    await dialog.confirm({
      title: '提示',
      msg: `是否确认${status === CommonStatus.ENABLE ? '启用' : '停用'}辅助核算项目“${formData.value.name}”？`,
    })
  } catch {
    return
  }
  statusUpdating.value = true
  try {
    await updateAuxiliaryItemStatus(accountSetId, Number(props.id), status)
    toast.success(status === CommonStatus.ENABLE ? '启用成功' : '停用成功')
    uni.$emit('fms:config:auxiliary:reload')
    await getDetail()
  } finally {
    statusUpdating.value = false
  }
}

/** 删除项目 */
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
      msg: `是否确认删除辅助核算项目“${formData.value.code} ${formData.value.name}”？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAuxiliaryItem(accountSetId, Number(props.id))
    toast.success('删除成功')
    uni.$emit('fms:config:auxiliary:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await loadAuxiliaryType()
  await getDetail()
})
</script>
