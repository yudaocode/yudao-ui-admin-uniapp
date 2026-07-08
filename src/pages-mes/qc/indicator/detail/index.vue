<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="质检指标详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="检测项编码" :value="formData?.code || '-'" />
        <wd-cell title="检测项名称" :value="formData?.name || '-'" />
        <wd-cell title="检测项类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_INDICATOR_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="检测工具" :value="formData?.tool || '-'" />
        <wd-cell title="结果值类型">
          <dict-tag v-if="formData?.resultType != null" :type="DICT_TYPE.MES_QC_RESULT_TYPE" :value="formData.resultType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="结果值属性" :value="formatResultSpecification()" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="编号" :value="formData?.id ? String(formData.id) : '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['mes:qc-indicator:update'])"
          class="flex-1"
          type="warning"
          @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:qc-indicator:delete'])"
          class="flex-1"
          type="danger"
          :loading="deleting"
          @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { QcIndicator } from '@/api/mes/qc/indicator'
import type { DictType } from '@/api/system/dict/type'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteIndicator, getIndicator } from '@/api/mes/qc/indicator'
import { getSimpleDictTypeList } from '@/api/system/dict/type'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesQcResultValueTypeEnum } from '@/utils/constants'
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
const formData = ref<QcIndicator>() // 详情数据
const dictTypeList = ref<DictType[]>([]) // 系统字典类型列表
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/indicator/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getIndicator(Number(props.id))
    if (formData.value.resultType === MesQcResultValueTypeEnum.DICT) {
      dictTypeList.value = await getSimpleDictTypeList()
    }
  } finally {
    toast.close()
  }
}

/** 格式化结果值属性 */
function formatResultSpecification() {
  if (!formData.value?.resultSpecification) {
    return '-'
  }
  if (formData.value.resultType === MesQcResultValueTypeEnum.FILE) {
    return formData.value.resultSpecification === 'IMG' ? '图片/照片' : '文件'
  }
  if (formData.value.resultType === MesQcResultValueTypeEnum.DICT) {
    const dictType = dictTypeList.value.find(item => item.type === formData.value?.resultSpecification)
    return dictType ? `${dictType.name}（${dictType.type}）` : formData.value.resultSpecification
  }
  return formData.value.resultSpecification
}

/** 编辑 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/qc/indicator/form/index?id=${props.id}` })
}

/** 删除质检指标 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该质检指标吗？删除后将无法恢复。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteIndicator(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:qc:indicator:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => {
  getDetail()
})
</script>
