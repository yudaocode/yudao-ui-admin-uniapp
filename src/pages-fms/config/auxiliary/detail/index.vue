<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="类别详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="类别名称" :value="formData.name || '-'" />
        <wd-cell title="辅助核算类型" :value="getTypeLabel(formData.type)" />
        <wd-cell title="系统预置" :value="formData.systemPreset ? '是' : '否'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮（系统预置类别不允许编辑、删除） -->
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
import type { AuxiliaryType } from '@/api/fms/config/auxiliary/type'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteAuxiliaryType, getAuxiliaryTypeList } from '@/api/fms/config/auxiliary/type'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { FmsAuxiliaryTypeOptions } from '@/pages-fms/utils/constants'
import { delay, navigateBackPlus } from '@/utils'

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
const formData = ref<AuxiliaryType>({} as AuxiliaryType) // 详情数据
const deleting = ref(false) // 删除状态

/** 仅自定义类别、账套可写且有权限时可编辑 */
const canEdit = computed(() =>
  fmsStore.isAccountSetWritable
  && !formData.value.systemPreset
  && hasAccessByCodes(['fms:config:auxiliary:update']),
)
/** 仅自定义类别、账套可写且有权限时可删除 */
const canDelete = computed(() =>
  fmsStore.isAccountSetWritable
  && !formData.value.systemPreset
  && hasAccessByCodes(['fms:config:auxiliary:delete']),
)

/** 辅助核算类型展示文案 */
function getTypeLabel(type?: number) {
  return FmsAuxiliaryTypeOptions.find(option => option.value === type)?.label || '-'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/auxiliary/index')
}

/** 加载类别详情（辅助核算类别无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getAuxiliaryTypeList(accountSetId)
  const auxiliaryType = list.find(item => item.id === Number(props.id))
  if (auxiliaryType) {
    formData.value = auxiliaryType
  }
}

/** 编辑类别 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/config/auxiliary/form/index?id=${props.id}` })
}

/** 删除类别 */
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
      msg: `是否确认删除辅助核算类别“${formData.value.name}”？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteAuxiliaryType(accountSetId, Number(props.id))
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
  await getDetail()
})
</script>
