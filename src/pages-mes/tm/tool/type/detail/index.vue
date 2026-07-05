<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="工具类型详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="类型编码" :value="formData?.code || '-'" />
        <wd-cell title="类型名称" :value="formData?.name || '-'" />
        <wd-cell title="编码管理">
          <dict-tag v-if="formData" :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="formData.codeFlag" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="保养维护类型">
          <dict-tag v-if="formData?.codeFlag && formData?.maintenType != null" :type="DICT_TYPE.MES_TM_MAINTEN_TYPE" :value="formData.maintenType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="保养周期" :value="formatMaintenPeriod(formData)" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['mes:tm-tool-type:update']) || hasAccessByCodes(['mes:tm-tool-type:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['mes:tm-tool-type:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:tm-tool-type:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { TmToolType } from '@/api/mes/tm/tool/type'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteToolType, getToolType } from '@/api/mes/tm/tool/type'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesMaintenTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<TmToolType>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/tm/tool/type/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  formData.value = await getToolType(Number(props.id))
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mes/tm/tool/type/form/index?id=${props.id}` })
}

/** 格式化保养周期 */
function formatMaintenPeriod(data?: TmToolType) {
  if (!data?.codeFlag || data.maintenPeriod == null) {
    return '-'
  }
  if (data.maintenType === MesMaintenTypeEnum.REGULAR) {
    return `${data.maintenPeriod} 天`
  }
  if (data.maintenType === MesMaintenTypeEnum.USAGE) {
    return `${data.maintenPeriod} 次`
  }
  return '-'
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该工具类型吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteToolType(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:tm:tool-type:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:tm:tool-type:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:tm:tool-type:reload', getDetail)
})
</script>
