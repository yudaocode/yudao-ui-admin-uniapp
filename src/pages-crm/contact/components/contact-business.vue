<template>
  <view class="mt-24rpx bg-white">
    <!-- 关联商机标题栏 -->
    <view class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx">
      <text class="text-30rpx text-[#333] font-semibold">关联商机</text>
      <view class="flex items-center gap-12rpx">
        <wd-button v-if="canCreate" size="small" type="primary" variant="plain" @click="handleCreate">
          新增商机
        </wd-button>
        <BusinessPicker
          v-if="canAdd"
          :customer-id="customerId"
          @confirm="handleAdd"
        >
          <wd-button size="small" type="primary">
            关联
          </wd-button>
        </BusinessPicker>
      </view>
    </view>

    <!-- 关联商机列表 -->
    <view
      v-for="business in list"
      :key="business.id"
      class="flex items-center justify-between border-b border-[#f5f5f5] px-24rpx py-20rpx"
    >
      <view class="min-w-0 flex-1">
        <view class="line-clamp-1 text-28rpx text-[#333] font-semibold">
          {{ business.name || '-' }}
        </view>
        <view class="mt-6rpx text-24rpx text-[#999]">
          金额：{{ formatMoney(business.totalPrice) }}
          <text v-if="business.statusName" class="ml-16rpx">阶段：{{ business.statusName }}</text>
        </view>
      </view>
      <wd-button
        v-if="canRemove"
        size="small"
        type="danger"
        variant="plain"
        @click="handleRemove(business)"
      >
        解除
      </wd-button>
    </view>

    <!-- 空状态 -->
    <wd-empty v-if="list.length === 0" icon="content" tip="暂无关联商机" />
  </view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Business } from '@/api/crm/business'
import { getBusinessListByContact } from '@/api/crm/business'
import { createContactBusinessList, deleteContactBusinessList } from '@/api/crm/contact'
import { useAccess } from '@/hooks/useAccess'
import { formatMoney } from '@/utils/format'
import BusinessPicker from '@/pages-crm/business/components/business-picker.vue'

const props = defineProps<{
  contactId: number
  customerId?: number
  canWrite?: boolean
}>()

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const list = ref<Record<string, any>[]>([]) // 关联商机列表
const canAdd = computed(() => hasAccessByCodes(['crm:contact:create-business']) && !!props.canWrite) // 关联权限（需对联系人有读写权限，与后端 CRM_CONTACT WRITE 对齐）
const canRemove = computed(() => hasAccessByCodes(['crm:contact:delete-business']) && !!props.canWrite) // 解除权限（同上）
const canCreate = computed(() => hasAccessByCodes(['crm:business:create']) && !!props.canWrite) // 新增商机权限（同上，否则提交后后端自动关联联系人会被 WRITE 网关拒绝）

/** 加载关联商机 */
async function loadList() {
  if (!props.contactId) {
    return
  }
  try {
    const data = await getBusinessListByContact(props.contactId)
    list.value = data || []
  } catch {
    list.value = []
  }
}

/** 关联商机 */
async function handleAdd(business?: Business) {
  const businessId = Number(business?.id)
  if (!businessId) {
    return
  }
  if (list.value.some(item => Number(item.id) === businessId)) {
    toast.show('该商机已关联')
    return
  }
  await createContactBusinessList({ contactId: props.contactId, businessIds: [businessId] })
  toast.success('关联成功')
  await loadList()
}

/** 解除关联 */
async function handleRemove(business: Record<string, any>) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定解除与商机【${business.name || ''}】的关联吗？`,
    })
  } catch {
    return
  }
  await deleteContactBusinessList({ contactId: props.contactId, businessIds: [Number(business.id)] })
  toast.success('解除成功')
  await loadList()
}

/** 新增商机并自动关联当前联系人（透传 contactId，提交后后端建立关联） */
function handleCreate() {
  const query = [`contactId=${props.contactId}`]
  if (props.customerId) {
    query.push(`customerId=${props.customerId}`)
  }
  uni.navigateTo({ url: `/pages-crm/business/form/index?${query.join('&')}` })
}

watch(() => props.contactId, loadList)

/** 初始化 */
onMounted(() => {
  loadList()
  uni.$on('crm:business:reload', loadList)
})

/** 卸载（新增商机返回后刷新关联列表） */
onUnmounted(() => {
  uni.$off('crm:business:reload', loadList)
})
</script>
