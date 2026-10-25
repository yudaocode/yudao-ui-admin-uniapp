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
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="标题" title-width="200rpx" prop="title">
            <wd-input v-model="formData.title" clearable placeholder="请输入标题" />
          </wd-form-item>
          <wd-form-item title="图片" title-width="200rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" />
          </wd-form-item>
          <wd-form-item title="跳转地址" title-width="200rpx" prop="url">
            <wd-input v-model="formData.url" clearable placeholder="请输入跳转地址" />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.position"
            label="位置"
            label-width="200rpx"
            prop="position"
            :dict-type="DICT_TYPE.PROMOTION_BANNER_POSITION"
            placeholder="请选择位置"
          />
          <wd-form-item title="排序" title-width="200rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="描述" title-width="200rpx" prop="memo">
            <wd-textarea v-model="formData.memo" clearable :maxlength="500" placeholder="请输入描述" />
          </wd-form-item>
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
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { PromotionBanner } from '@/api/mall/promotion/banner'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionBanner,
  getPromotionBanner,
  updatePromotionBanner,
} from '@/api/mall/promotion/banner'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

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
const getTitle = computed(() => props.id ? '编辑 Banner' : '新增 Banner')
const formLoading = ref(false) // 表单提交状态
const formData = ref<PromotionBanner>({
  id: undefined,
  title: '',
  picUrl: '',
  url: '',
  position: 1,
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  memo: '',
}) // 表单数据
const formSchema = createFormSchema({
  title: [{ required: true, message: '标题不能为空' }],
  picUrl: [{ required: true, message: '图片不能为空' }],
  url: [{ required: true, message: '跳转地址不能为空' }],
  position: [{ required: true, message: '位置不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/banner/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getPromotionBanner(props.id)
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updatePromotionBanner(data)
      toast.success('修改成功')
    } else {
      await createPromotionBanner(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-banner:reload')
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
