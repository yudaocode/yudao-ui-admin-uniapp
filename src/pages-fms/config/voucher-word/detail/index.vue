<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="凭证字详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="凭证字" :value="formData.name || '-'" />
        <wd-cell title="打印标题" :value="formData.printTitle || '-'" />
        <wd-cell title="是否默认" :value="formData.defaultStatus ? '是' : '否'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="canEdit || canDelete" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="canEdit" class="flex-1" type="primary" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="canDelete" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { VoucherWord } from '@/api/fms/config/voucher-word'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onUnload } from '@dcloudio/uni-app'
import { deleteVoucherWord, getVoucherWordList } from '@/api/fms/config/voucher-word'
import { useAccess } from '@/hooks/useAccess'
import { useFmsStore } from '@/pages-fms/store/fms'
import { delay, navigateBackPlus } from '@/utils'
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
const formData = ref<VoucherWord>({} as VoucherWord) // 详情数据
const deleting = ref(false) // 删除状态

const canEdit = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:voucher-word:update'])) // 仅账套可写且有权限时可编辑
const canDelete = computed(() => // 默认凭证字不允许删除
  fmsStore.isAccountSetWritable
  && !formData.value.defaultStatus
  && hasAccessByCodes(['fms:config:voucher-word:delete']),
)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/voucher-word/index')
}

/** 加载凭证字详情（凭证字无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getVoucherWordList(accountSetId)
  const voucherWord = list.find(item => item.id === Number(props.id))
  if (voucherWord) {
    formData.value = voucherWord
  }
}

/** 编辑凭证字 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/config/voucher-word/form/index?id=${props.id}` })
}

/** 删除凭证字 */
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
      msg: `是否确认删除凭证字“${formData.value.name}”？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteVoucherWord(accountSetId, Number(props.id))
    toast.success('删除成功')
    uni.$emit('fms:config:voucher-word:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await fmsStore.loadAccountSetList()
  await getDetail()
  uni.$on('fms:config:voucher-word:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('fms:config:voucher-word:reload', getDetail)
})
</script>
