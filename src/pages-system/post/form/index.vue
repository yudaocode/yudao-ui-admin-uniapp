<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :rules="formRules">
        <wd-cell-group border>
          <wd-input
            v-model="formData.name"
            label="岗位名称"
            label-width="180rpx"
            prop="name"
            clearable
            placeholder="请输入岗位名称"
          />
          <wd-input
            v-model="formData.code"
            label="岗位编码"
            label-width="180rpx"
            prop="code"
            clearable
            placeholder="请输入岗位编码"
          />
          <wd-cell title="显示顺序" title-width="180rpx" prop="sort" center>
            <wd-input-number
              v-model="formData.sort"
              :min="0"
            />
          </wd-cell>
          <wd-cell title="状态" title-width="180rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-cell>
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="180rpx"
            placeholder="请输入备注"
            :maxlength="200"
            show-word-limit
            clearable
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { Post } from '@/api/system/post'
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'wot-design-uni'
import { createPost, getPost, updatePost } from '@/api/system/post'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'

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
const getTitle = computed(() => props.id ? '编辑岗位' : '新增岗位')
const formLoading = ref(false)
const formData = ref<Post>({
  id: undefined,
  name: '',
  code: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  remark: '',
})
const formRules = {
  name: [{ required: true, message: '岗位名称不能为空' }],
  code: [{ required: true, message: '岗位编码不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
}
const formRef = ref()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-system/post/index')
}

/** 加载岗位详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getPost(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updatePost(formData.value)
      toast.success('修改成功')
    } else {
      await createPost(formData.value)
      toast.success('新增成功')
    }
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>

<style lang="scss" scoped>
</style>
