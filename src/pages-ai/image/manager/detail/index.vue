<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="绘图详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容：管理员视角 -->
    <view v-if="formData" class="pb-160rpx">
      <wd-cell-group border>
        <wd-cell title="用户" :value="getUserName(formData.userId)" />
        <wd-cell title="是否公开">
          <wd-switch
            v-if="hasAccessByCodes(['ai:image:update'])"
            :model-value="formData.publicStatus"
            :disabled="formData.status !== AiImageStatusEnum.SUCCESS"
            @change="handlePublicChange"
          />
          <text v-else>{{ formData.publicStatus ? '是' : '否' }}</text>
        </wd-cell>
      </wd-cell-group>
      <ImageDetail :image="formData" scope="admin" @open="handleOpen" />
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['ai:image:delete'])" class="yd-detail-footer">
      <wd-button type="danger" block :loading="deleting" @click="handleDelete">
        删除
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { AiImage } from '@/api/ai/image'
import type { User } from '@/api/system/user'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { deleteImage, getImage, updateImage } from '@/api/ai/image'
import { getSimpleUserList } from '@/api/system/user'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { AiImageStatusEnum } from '@/utils/constants'
import ImageDetail from '../../components/image-detail.vue'

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
const formData = ref<AiImage>() // 详情数据
const deleting = ref(false) // 删除状态
const userList = ref<User[]>([]) // 用户精简列表

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/image/manager/index')
}

/** 加载绘图详情 */
async function getDetail() {
  if (!props.id || deleting.value) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getImage(Number(props.id))
  } finally {
    toast.close()
  }
}

/** 打开来源、派生作品 */
function handleOpen(id: number) {
  uni.navigateTo({ url: `/pages-ai/image/manager/detail/index?id=${id}` })
}

/** 切换公开状态 */
async function handlePublicChange({ value }: { value: unknown }) {
  if (!formData.value) {
    return
  }
  const publicStatus = !!value
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要“${publicStatus ? '公开' : '取消公开'}”该图片吗？`,
    })
  } catch {
    return
  }
  await updateImage({ id: formData.value.id, publicStatus })
  formData.value.publicStatus = publicStatus
  toast.success('更新成功')
  uni.$emit('ai:image:reload')
}

/** 删除绘图记录 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该绘图记录吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteImage(Number(props.id))
    toast.success('删除成功')
    uni.$emit('ai:image:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 获取用户昵称 */
function getUserName(userId?: number) {
  return userList.value.find(user => user.id === userId)?.nickname || String(userId ?? '-')
}

/** 初始化 */
onMounted(async () => {
  await Promise.all([
    getDetail(),
    getSimpleUserList().then(data => userList.value = data),
  ])
})
</script>
