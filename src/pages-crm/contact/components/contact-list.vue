<template>
  <!-- 联系人列表（按客户/商机加载，卡片样式对齐联系人列表页） -->
  <view class="min-h-0 flex flex-1 flex-col">
    <!-- 关联联系人 -->
    <view v-if="props.businessId && canAddBusinessContact" class="flex justify-end bg-white px-24rpx py-16rpx">
      <ContactPicker
        :customer-id="props.customerId"
        @confirm="handleAddBusinessContact"
      >
        <wd-button size="small" type="primary">
          关联联系人
        </wd-button>
      </ContactPicker>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无联系人"
      @query="queryList"
    >
      <view class="p-24rpx pb-160rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm" @click="handleDetail(item)">
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
              {{ item.name || '-' }}
            </view>
            <wd-tag v-if="item.master" type="primary" variant="plain">
              关键决策人
            </wd-tag>
          </view>
          <view v-if="item.mobile" class="mb-12rpx text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">手机：</text>{{ item.mobile }}
          </view>
          <view v-if="item.ownerUserName" class="text-28rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">负责人：</text>{{ item.ownerUserName }}
          </view>
          <view v-if="props.businessId && canRemoveBusinessContact" class="mt-16rpx flex justify-end">
            <wd-button
              size="small"
              type="danger"
              variant="plain"
              @click.stop="handleRemoveBusinessContact(item)"
            >
              解除关联
            </wd-button>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { createContactBusinessList2, deleteContactBusinessList2, getContactPageByBusiness, getContactPageByCustomer } from '@/api/crm/contact'
import { useAccess } from '@/hooks/useAccess'
import ContactPicker from '@/pages-crm/contact/components/contact-picker.vue'
import type { Contact } from '@/api/crm/contact'

const props = defineProps<{ customerId?: number, businessId?: number }>()
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<Record<string, any>[]>([]) // 联系人列表
const pagingRef = ref<any>() // 分页组件引用
const canAddBusinessContact = computed(() => !!props.businessId && hasAccessByCodes(['crm:contact:create-business'])) // 关联联系人权限
const canRemoveBusinessContact = computed(() => !!props.businessId && hasAccessByCodes(['crm:contact:delete-business'])) // 解除联系人权限

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.customerId && !props.businessId) {
    pagingRef.value?.complete([])
    return
  }
  try {
    const data = props.businessId
      ? await getContactPageByBusiness({
          pageNo,
          pageSize,
          businessId: props.businessId,
          customerId: props.customerId,
        })
      : await getContactPageByCustomer({
          pageNo,
          pageSize,
          customerId: props.customerId!,
        })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 查看详情 */
function handleDetail(item: Record<string, any>) {
  uni.navigateTo({ url: `/pages-crm/contact/detail/index?id=${item.id}` })
}

/** 新增联系人 */
function openAdd() {
  const params = [
    props.customerId ? `customerId=${props.customerId}` : '',
    props.businessId ? `businessId=${props.businessId}` : '',
  ].filter(Boolean).join('&')
  const query = params ? `?${params}` : ''
  uni.navigateTo({ url: `/pages-crm/contact/form/index${query}` })
}

/** 关联既有联系人 */
async function handleAddBusinessContact(contact?: Contact) {
  const businessId = props.businessId
  const contactId = Number(contact?.id)
  if (!businessId || !contactId) {
    return
  }
  if (list.value.some(item => Number(item.id) === contactId)) {
    toast.show('该联系人已关联')
    return
  }
  await createContactBusinessList2({ businessId, contactIds: [contactId] })
  toast.success('关联成功')
  reload()
}

/** 解除联系人关联 */
async function handleRemoveBusinessContact(item: Record<string, any>) {
  const businessId = props.businessId
  if (!businessId || !item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定解除与联系人【${item.name || ''}】的关联吗？` })
  } catch {
    return
  }
  await deleteContactBusinessList2({ businessId, contactIds: [Number(item.id)] })
  toast.success('解除成功')
  reload()
}

watch(() => [props.customerId, props.businessId], () => reload())

defineExpose({
  reload,
  getList: reload,
  openAdd,
})

/** 初始化 */
onMounted(() => {
  uni.$on('crm:contact:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('crm:contact:reload', reload)
})
</script>
