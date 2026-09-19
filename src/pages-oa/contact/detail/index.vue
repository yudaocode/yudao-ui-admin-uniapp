<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="联系人详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="姓名" :value="formData?.name ?? '-'" />
        <wd-cell title="分类" :value="categoryName || '-'" />
        <wd-cell title="性别" :value="sexText" />
        <wd-cell title="手机号码" :value="formData?.mobile || '-'" />
        <wd-cell title="邮箱" :value="formData?.email || '-'" />
        <wd-cell title="公司电话" :value="formData?.companyPhone || '-'" />
        <wd-cell title="公司名称" :value="formData?.companyName || '-'" />
        <wd-cell title="联系地址" :value="formData?.address || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建人" :value="formData?.ownerUserName || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 共享记录 -->
      <view v-if="formData?.shares?.length" class="mt-20rpx">
        <view class="px-24rpx py-16rpx text-28rpx text-[#333] font-semibold">
          共享记录（{{ formData.shares.length }}）
        </view>
        <view
          v-for="share in formData.shares"
          :key="share.id"
          class="mb-16rpx rounded-12rpx bg-white p-24rpx"
        >
          <view class="mb-8rpx flex items-center justify-between">
            <text class="text-28rpx text-[#333] font-semibold">{{ share.userName || '-' }}</text>
            <wd-tag :type="share.handleStatus ? 'success' : 'warning'">
              {{ share.handleStatus ? '已处理' : '待处理' }}
            </wd-tag>
          </view>
          <view class="text-24rpx text-[#999]">
            分类：{{ share.categoryName || '未分类' }} · {{ formatDateTime(share.createTime) || '-' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view v-if="formData" class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="primary" @click="shareVisible = true">
          共享
        </wd-button>
        <template v-if="scene === 'mine'">
          <template v-if="isOwner">
            <wd-button
              v-if="hasAccessByCodes(['oa:contact:update'])"
              class="flex-1" type="warning" @click="handleEdit"
            >
              编辑
            </wd-button>
            <wd-button
              v-if="hasAccessByCodes(['oa:contact:delete'])"
              class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
            >
              删除
            </wd-button>
          </template>
          <template v-else>
            <wd-button class="flex-1" type="primary" @click="handleOpenCategoryPopup">
              移动
            </wd-button>
            <wd-button class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
              删除
            </wd-button>
          </template>
        </template>
        <template v-else-if="scene === 'received'">
          <wd-button
            v-if="!formData.handleStatus"
            class="flex-1" type="primary" @click="handleOpenCategoryPopup"
          >
            处理
          </wd-button>
          <wd-button class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
            删除
          </wd-button>
        </template>
      </view>
    </view>

    <!-- 共享仅追加接收人，不撤销已有共享 -->
    <wd-popup v-model="shareVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-24rpx">
        <view class="mb-24rpx text-center text-32rpx font-semibold">
          共享联系人
        </view>
        <UserFormPicker v-model="shareUserIds" type="checkbox" label="共享给" />
        <view class="my-24rpx text-24rpx text-[#999]">
          仅追加共享接收人，取消勾选不会撤销已有共享。
        </view>
        <wd-button type="primary" block :loading="sharing" @click="handleShareConfirm">
          确定
        </wd-button>
      </view>
    </wd-popup>

    <!-- 归类弹窗：处理共享 / 移动到我的分类 -->
    <wd-popup v-model="handlePopupVisible" position="bottom" root-portal custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ scene === 'received' ? '处理共享' : '移动到分类' }}
        </view>
        <wd-radio-group v-model="handleCategoryId" class="w-full" type="dot">
          <wd-radio :value="0" class="mb-16rpx block">
            不归入分类
          </wd-radio>
          <wd-radio
            v-for="item in categoryList"
            :key="item.id"
            :value="item.id"
            class="mb-16rpx block"
          >
            {{ item.name }}
          </wd-radio>
        </wd-radio-group>
        <wd-button type="primary" block :loading="handling" @click="handleShareHandle">
          确定
        </wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { Contact } from '@/api/oa/contact'
import type { ContactCategory } from '@/api/oa/contact/category'
import { onUnload } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import {
  deleteContact,
  deleteReceivedContact,
  getContact,
  handleContactShare,
  shareContact,
} from '@/api/oa/contact'
import { getSimpleContactCategoryList } from '@/api/oa/contact/category'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { useAccess } from '@/hooks/useAccess'
import { useUserStore } from '@/store/user'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: string
  scene?: string // 打开场景：mine 我的 / received 共享与我 / sent 我共享的
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const userStore = useUserStore()
const dialog = useDialog()
const toast = useToast()
const formData = ref<Contact>() // 详情数据
const deleting = ref(false) // 删除状态
const scene = computed(() => props.scene || 'mine') // 当前场景
const categoryName = computed(() => formData.value?.sharedCategoryName) // 当前持有人的分类
const sexText = computed(() => // 性别文案
  formData.value?.sex === 1 ? '男' : formData.value?.sex === 2 ? '女' : '未知')
const isOwner = computed(() => formData.value?.ownerUserId === userStore.userInfo.userId) // 当前用户是否创建人
const shareVisible = ref(false) // 共享弹窗显示状态
const sharing = ref(false) // 共享提交状态
const shareUserIds = ref<number[]>([]) // 共享选择的用户编号
const handlePopupVisible = ref(false) // 处理共享弹窗显示状态
const handleCategoryId = ref(0) // 处理共享选中的分类编号
const handling = ref(false) // 处理共享提交状态
const categoryList = ref<ContactCategory[]>([]) // 分类选项

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/contact/index')
}

/** 加载联系人详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getContact(Number(props.id))
    // 共享选择器回显已有接收人，后端会过滤重复共享
    shareUserIds.value = (formData.value.shares || []).map(share => share.userId)
  } finally {
    toast.close()
  }
}

/** 编辑联系人 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-oa/contact/form/index?id=${props.id}`,
  })
}

/** 删除联系人 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: scene.value === 'mine' && isOwner.value ? '确定要删除该联系人吗？' : '确定要删除该共享联系人吗？仅移除自己的共享记录。',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    // 非本人持有的联系人仅移除自己的持有关系，不影响联系人和其他持有人
    if (scene.value === 'mine' && isOwner.value) {
      await deleteContact(Number(props.id))
    } else {
      await deleteReceivedContact(Number(props.id))
    }
    toast.success('删除成功')
    uni.$emit('oa:contact:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 共享联系人 */
async function handleShareConfirm() {
  if (sharing.value) {
    return
  }
  if (!props.id || shareUserIds.value.length === 0) {
    if (shareUserIds.value.length === 0) {
      toast.warning('请选择要共享的用户')
    }
    return
  }
  sharing.value = true
  try {
    await shareContact(Number(props.id), shareUserIds.value)
    toast.success('共享成功')
    shareVisible.value = false
    uni.$emit('oa:contact:reload')
  } finally {
    sharing.value = false
  }
}

/** 打开处理共享/移动分类弹窗：回显当前分类 */
async function handleOpenCategoryPopup() {
  handleCategoryId.value = formData.value?.sharedCategoryId ?? 0
  if (categoryList.value.length === 0) {
    categoryList.value = await getSimpleContactCategoryList()
  }
  handlePopupVisible.value = true
}

/** 处理共享 */
async function handleShareHandle() {
  if (!props.id) {
    return
  }
  handling.value = true
  try {
    await handleContactShare(Number(props.id), handleCategoryId.value || undefined)
    toast.success(scene.value === 'received' ? '处理成功' : '移动成功')
    handlePopupVisible.value = false
    uni.$emit('oa:contact:reload')
    getDetail()
  } finally {
    handling.value = false
  }
}

/** 初始化 */
onMounted(() => {
  uni.$on('oa:contact:reload', getDetail)
  getDetail()
})

/** 卸载 */
onUnload(() => {
  uni.$off('oa:contact:reload', getDetail)
})
</script>
