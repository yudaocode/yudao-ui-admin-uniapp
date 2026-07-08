<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="计量单位详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="单位编码" :value="formData?.code || '-'" />
        <wd-cell title="单位名称" :value="formData?.name || '-'" />
        <wd-cell title="单位类型">
          <dict-tag
            v-if="formData?.primaryFlag !== undefined"
            :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
            :value="formData.primaryFlag"
          />
          <text v-else>-</text>
        </wd-cell>
        <template v-if="formData && !formData.primaryFlag">
          <wd-cell title="所属主单位" :value="primaryUnitName" />
          <wd-cell title="换算比例" :value="formatChangeRate(formData.changeRate)" />
        </template>
        <wd-cell title="状态">
          <dict-tag
            v-if="formData?.status !== undefined"
            :type="DICT_TYPE.COMMON_STATUS"
            :value="formData.status"
          />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['mes:md-unit-measure:update']) || hasAccessByCodes(['mes:md-unit-measure:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['mes:md-unit-measure:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mes:md-unit-measure:delete'])"
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
import type { MdUnitMeasure } from '@/api/mes/md/unitmeasure'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteUnitMeasure, getUnitMeasure, getUnitMeasureSimpleList } from '@/api/mes/md/unitmeasure'
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
const formData = ref<MdUnitMeasure>() // 详情数据
const unitOptions = ref<MdUnitMeasure[]>([]) // 单位选项
const deleting = ref(false) // 删除状态
const primaryUnitName = computed(() => {
  const primaryId = formData.value?.primaryId
  if (!primaryId) {
    return '-'
  }
  return unitOptions.value.find(item => String(item.id) === String(primaryId))?.name || `#${primaryId}`
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/unitmeasure/index')
}

/** 格式化换算比例 */
function formatChangeRate(value?: number) {
  return value === undefined || value === null ? '-' : String(value)
}

/** 加载计量单位详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const [detail, units] = await Promise.all([
      getUnitMeasure(Number(props.id)),
      getUnitMeasureSimpleList(),
    ])
    formData.value = detail
    unitOptions.value = units
  } finally {
    toast.close()
  }
}

/** 编辑计量单位 */
function handleEdit() {
  if (!props.id) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/md/unitmeasure/form/index?id=${props.id}` })
}

/** 删除计量单位 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该计量单位吗？被物料或业务单据引用时将无法删除。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteUnitMeasure(Number(props.id))
    toast.success('删除成功')
    uni.$emit('mes:md:unitmeasure:reload')
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
