<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="编辑公众号粉丝"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData">
        <wd-cell-group border>
          <wd-form-item title="昵称" title-width="220rpx" prop="nickname">
            <wd-input v-model="formData.nickname" clearable placeholder="请输入昵称" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-input v-model="formData.remark" clearable placeholder="请输入备注" />
          </wd-form-item>
          <TagFormPicker v-model="formData.tagIds" />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MpUser } from '@/api/mp/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getUser, updateUser } from '@/api/mp/user'
import { delay, navigateBackPlus } from '@/utils'
import TagFormPicker from '@/pages-mp/tag/components/tag-form-picker.vue'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const formData = ref<MpUser>({
  id: undefined,
  nickname: '',
  remark: '',
  tagIds: [],
}) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/user/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    formData.value = await getUser(Number(props.id))
    formData.value.tagIds = formData.value.tagIds || []
  } catch {
    // 请求层已提示错误，保留默认表单
  }
}

/** 提交表单 */
async function handleSubmit() {
  if (!props.id) {
    toast.show('缺少粉丝编号')
    return
  }
  formLoading.value = true
  try {
    await updateUser({
      id: Number(props.id),
      nickname: formData.value.nickname,
      remark: formData.value.remark,
      tagIds: formData.value.tagIds,
    })
    toast.success('修改成功')
    uni.$emit('mp:user:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
