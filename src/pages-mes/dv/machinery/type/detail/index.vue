<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备类型详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="类型编码" :value="formData?.code || '-'" />
        <wd-cell title="类型名称" :value="formData?.name || '-'" />
        <wd-cell title="上级类型" :value="getParentName() || '-'" />
        <wd-cell title="显示排序" :value="formData?.sort ?? '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <view
      v-if="hasAccessByCodes(['mes:dv-machinery-type:create']) || hasAccessByCodes(['mes:dv-machinery-type:update']) || hasAccessByCodes(['mes:dv-machinery-type:delete'])"
      class="yd-detail-footer"
    >
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['mes:dv-machinery-type:create'])" class="flex-1" type="success" @click="handleAddChild">
          新增子类型
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:dv-machinery-type:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['mes:dv-machinery-type:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DvMachineryType } from '@/api/mes/dv/machinery/type'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteMachineryType, getMachineryType, getMachineryTypeSimpleList } from '@/api/mes/dv/machinery/type'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
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
const formData = ref<DvMachineryType>() // 详情数据
const deleting = ref(false) // 删除状态
const machineryTypeList = ref<DvMachineryType[]>([]) // 类型列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/machinery/type/index')
}

/** 获取上级类型名称 */
function getParentName(): string {
  if (!formData.value?.parentId || formData.value.parentId === 0) {
    return '顶级类型'
  }
  const parent = machineryTypeList.value.find(item => item.id === formData.value?.parentId)
  return parent?.name || '未知'
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getMachineryType(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 新增子类型 */
function handleAddChild() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/dv/machinery/type/form/index?parentId=${props.id}` })
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/dv/machinery/type/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除设备类型「${formData.value?.name || ''}」吗？` })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMachineryType(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:dv:machinery-type:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  machineryTypeList.value = await getMachineryTypeSimpleList()
})

/** 加载详情 */
onShow(() => {
  getDetail()
})
</script>
