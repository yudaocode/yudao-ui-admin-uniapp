<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="摘要详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情信息 -->
    <view v-if="formData.id" class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="摘要内容" :value="formData.content || '-'" />
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
import type { Digest } from '@/api/fms/config/digest'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { deleteDigest, getDigestList } from '@/api/fms/config/digest'
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
const formData = ref<Digest>({} as Digest) // 详情数据
const deleting = ref(false) // 删除状态

/** 仅账套可写且有权限时可编辑 */
const canEdit = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:digest:update']))
/** 仅账套可写且有权限时可删除 */
const canDelete = computed(() => fmsStore.isAccountSetWritable && hasAccessByCodes(['fms:config:digest:delete']))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-fms/config/digest/index')
}

/** 加载摘要详情（摘要库无 /get 接口，从账套级列表中查找） */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  const accountSetId = fmsStore.accountSet?.id
  if (!accountSetId) {
    return
  }
  const list = await getDigestList(accountSetId)
  const digest = list.find(item => item.id === Number(props.id))
  if (digest) {
    formData.value = digest
  }
}

/** 编辑摘要 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-fms/config/digest/form/index?id=${props.id}` })
}

/** 删除摘要 */
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
      msg: `是否确认删除常用摘要“${formData.value.content}”？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteDigest(accountSetId, Number(props.id))
    toast.success('删除成功')
    uni.$emit('fms:config:digest:reload')
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
