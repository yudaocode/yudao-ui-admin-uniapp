<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="字典类型详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="字典编号" :value="formData?.id" />
        <wd-cell title="字典名称" :value="formData?.name" />
        <wd-cell title="字典类型" :value="formData?.type" />
        <wd-cell title="状态">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData?.status" />
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark ?? '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime)" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button
          v-if="hasAccessByCodes(['system:dict:update'])"
          class="flex-1" type="warning" @click="handleEdit"
        >
          编辑
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['system:dict:delete'])"
          class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
        >
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DictType } from '@/api/system/dict/type'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteDictType, getDictType } from '@/api/system/dict/type'
import { useAccess } from '@/hooks/useAccess'
import { useDictStore } from '@/store/dict'
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
const dialog = useDialog()
const toast = useToast()
const dictStore = useDictStore()
const formData = ref<DictType>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/dict/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getDictType(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-system/dict/type/form/index?id=${props.id}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该字典类型吗？',
    })
  } catch {
    return
  }
  // 执行删除
  deleting.value = true
  try {
    await deleteDictType(props.id)
    toast.success('删除成功')
    uni.$emit('system:dict-type:reload')
    void dictStore.refreshDictCache() // 同步字典缓存，供 BPM 表单等页面使用最新字典
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('system:dict-type:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('system:dict-type:reload', getDetail)
})
</script>
