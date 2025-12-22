<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="个人资料"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 信息区域 -->
    <wd-cell-group custom-class="cell-group" border>
      <wd-cell title="头像" is-link center @click="handleEditAvatar">
        <view class="ml-auto h-50rpx w-50rpx overflow-hidden rounded-full">
          <image :src="userProfile?.avatar" mode="aspectFill" class="h-full w-full" />
        </view>
      </wd-cell>
      <wd-cell title="昵称" :value="userProfile?.nickname || '-'" is-link @click="handleEdit('nickname')" />
      <wd-cell title="性别" :value="getDictLabel(DICT_TYPE.SYSTEM_USER_SEX, userProfile?.sex) || '-'" is-link @click="handleEdit('sex')" />
      <wd-cell title="手机" :value="userProfile?.mobile || '-'" is-link @click="handleEdit('mobile')" />
      <wd-cell title="邮箱" :value="userProfile?.email || '-'" is-link @click="handleEdit('email')" />
    </wd-cell-group>
    <wd-cell-group custom-class="cell-group mt-24rpx" border>
      <wd-cell title="部门" :value="userProfile?.dept?.name || '-'" />
      <wd-cell title="岗位" :value="userProfile?.posts?.map(p => p.name).join('、') || '-'" />
      <wd-cell title="角色" :value="userProfile?.roles?.map(r => r.name).join('、') || '-'" />
    </wd-cell-group>

    <!-- 头像裁剪 -->
    <wd-img-cropper
      v-model="showCropper"
      :img-src="cropperSrc"
      @confirm="handleCropperConfirm"
    />
    <!-- 编辑弹窗 -->
    <Form
      v-model="formVisible"
      :field="formType"
      :value="formValue"
      @success="loadUserProfile"
    />
  </view>
</template>

<script lang="ts" setup>
import type { UserProfileVO } from '@/api/system/user/profile'
import { onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { getUserProfile, updateUserProfile } from '@/api/system/user/profile'
import { getDictLabel } from '@/hooks/useDict'
import { useUserStore } from '@/store/user'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { uploadFileFromPath } from '@/utils/uploadFile'
import Form from './components/form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const userStore = useUserStore()
const loading = ref(true)
const userProfile = ref<UserProfileVO | null>(null)

// 头像裁剪相关
const showCropper = ref(false)
const cropperSrc = ref('')

// 编辑弹窗相关
const formVisible = ref(false)
const formType = ref<'nickname' | 'sex' | 'mobile' | 'email'>('nickname')
const formValue = ref<string | number>('')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages/user/index')
}

/** 加载用户信息 */
async function loadUserProfile() {
  loading.value = true
  try {
    userProfile.value = await getUserProfile()
  } finally {
    loading.value = false
  }
}

/** 编辑头像 */
function handleEditAvatar() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      cropperSrc.value = res.tempFilePaths[0]
      showCropper.value = true
    },
  })
}

/** 头像裁剪确认 */
async function handleCropperConfirm(event: { tempFilePath: string }) {
  // 1.1 上传文件，获取 URL
  const avatarUrl = await uploadFileFromPath(event.tempFilePath, 'avatar')
  // 1.2 更新用户头像
  await updateUserProfile({ avatar: avatarUrl })

  // 2.1 直接更新本地状态，避免重新加载
  if (userProfile.value) {
    userProfile.value.avatar = avatarUrl
  }
  // 2.2 同步更新 userStore 中的头像
  userStore.setUserAvatar(avatarUrl)
  toast.success('头像修改成功')
}

/** 编辑字段 */
function handleEdit(field: 'nickname' | 'sex' | 'mobile' | 'email') {
  formType.value = field
  formValue.value = userProfile.value?.[field] ?? (field === 'sex' ? 1 : '')
  formVisible.value = true
}

/** 初始化 */
onMounted(() => {
  loadUserProfile()
})
</script>

<style lang="scss" scoped>
:deep(.cell-group) {
  margin: 24rpx;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 3rpx 8rpx rgba(24, 144, 255, 0.06);
}
</style>
