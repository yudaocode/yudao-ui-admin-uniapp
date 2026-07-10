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
          <ArticleCategoryFormPicker
            v-model="formData.categoryId"
            label="文章分类"
            label-width="200rpx"
            prop="categoryId"
          />
          <wd-form-item title="文章标题" title-width="200rpx" prop="title">
            <wd-input v-model="formData.title" clearable placeholder="请输入文章标题" />
          </wd-form-item>
          <wd-form-item title="文章作者" title-width="200rpx" prop="author">
            <wd-input v-model="formData.author" clearable placeholder="请输入文章作者" />
          </wd-form-item>
          <wd-form-item title="文章封面" title-width="200rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" />
          </wd-form-item>
          <wd-form-item title="文章简介" title-width="200rpx" prop="introduction">
            <wd-textarea v-model="formData.introduction" clearable :maxlength="500" placeholder="请输入文章简介" />
          </wd-form-item>
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
          <SpuSelect
            v-model="formData.spuId"
            label="关联商品"
            label-width="200rpx"
            prop="spuId"
            placeholder="请选择关联商品"
          />
          <wd-form-item title="是否热门" title-width="200rpx" prop="recommendHot" center>
            <wd-radio-group v-model="formData.recommendHot" type="button">
              <wd-radio :value="true">
                是
              </wd-radio>
              <wd-radio :value="false">
                否
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="是否轮播" title-width="200rpx" prop="recommendBanner" center>
            <wd-radio-group v-model="formData.recommendBanner" type="button">
              <wd-radio :value="true">
                是
              </wd-radio>
              <wd-radio :value="false">
                否
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="文章内容" title-width="200rpx" prop="content">
            <view class="w-full">
              <wd-textarea v-model="formData.content" clearable :maxlength="20000" placeholder="请输入文章内容" />
              <view class="mt-8rpx text-22rpx text-[#fa3534] leading-32rpx">
                富文本内容建议前往 PC 端编辑（移动端为纯文本，保存会覆盖原有富文本）
              </view>
            </view>
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
import type { PromotionArticle } from '@/api/mall/promotion/article'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createPromotionArticle,
  getPromotionArticle,
  updatePromotionArticle,
} from '@/api/mall/promotion/article'
import { getIntDictOptions } from '@/hooks/useDict'
import ArticleCategoryFormPicker from '@/pages-mall/promotion/article/category/components/article-category-form-picker.vue'
import SpuSelect from '@/pages-mall/promotion/components/spu-select.vue'
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
const getTitle = computed(() => props.id ? '编辑文章' : '新增文章')
const formLoading = ref(false) // 表单提交状态
const formData = ref<PromotionArticle>({
  id: undefined,
  categoryId: undefined,
  title: '',
  author: '',
  picUrl: '',
  introduction: '',
  sort: 0,
  status: CommonStatusEnum.ENABLE,
  spuId: undefined,
  recommendHot: false,
  recommendBanner: false,
  content: '',
}) // 表单数据
const formSchema = createFormSchema({
  categoryId: [{ required: true, message: '文章分类不能为空' }],
  title: [{ required: true, message: '文章标题不能为空' }],
  picUrl: [{ required: true, message: '文章封面不能为空' }],
  sort: [{ required: true, message: '排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  spuId: [{ required: true, message: '关联商品不能为空' }],
  content: [{ required: true, message: '文章内容不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/article/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getPromotionArticle(Number(props.id))
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
      await updatePromotionArticle(data)
      toast.success('修改成功')
    } else {
      await createPromotionArticle(data)
      toast.success('新增成功')
    }
    uni.$emit('mall:promotion-article:reload')
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
