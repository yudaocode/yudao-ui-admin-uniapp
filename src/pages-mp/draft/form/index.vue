<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 图文列表 -->
    <view class="bg-white px-24rpx py-20rpx">
      <view class="mb-16rpx flex items-center justify-between">
        <view class="text-28rpx text-[#333] font-semibold">
          图文列表
        </view>
        <wd-button v-if="isCreating && articles.length < 8" size="small" type="primary" @click="handleAddArticle">
          新增图文
        </wd-button>
      </view>
      <view class="flex flex-col gap-12rpx">
        <view
          v-for="(article, index) in articles"
          :key="index"
          class="border rounded-8rpx px-20rpx py-16rpx"
          :class="activeIndex === index ? 'border-[#1890ff] bg-[#f0f7ff]' : 'border-[#eee] bg-white'"
          @click="handleSwitchArticle(index)"
        >
          <view class="flex items-center gap-16rpx">
            <view
              class="h-40rpx w-40rpx flex shrink-0 items-center justify-center rounded-full text-24rpx"
              :class="activeIndex === index ? 'bg-[#1890ff] text-white' : 'bg-[#f5f5f5] text-[#666]'"
            >
              {{ index + 1 }}
            </view>
            <view
              class="min-w-0 flex-1 truncate text-26rpx"
              :class="activeIndex === index ? 'text-[#1890ff] font-medium' : 'text-[#333]'"
            >
              {{ article.title || '未命名图文' }}
            </view>
          </view>
          <view v-if="activeIndex === index" class="mt-16rpx flex gap-12rpx">
            <wd-button class="flex-1" size="small" variant="plain" :disabled="index === 0" @click.stop="handleMoveArticle(index, -1)">
              上移
            </wd-button>
            <wd-button class="flex-1" size="small" variant="plain" :disabled="index === articles.length - 1" @click.stop="handleMoveArticle(index, 1)">
              下移
            </wd-button>
            <wd-button v-if="isCreating" class="flex-1" size="small" type="danger" :disabled="articles.length <= 1" @click.stop="handleRemoveArticle(index)">
              删除
            </wd-button>
          </view>
        </view>
      </view>
    </view>

    <!-- 表单区域 -->
    <view class="mt-16rpx">
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="标题" title-width="220rpx" prop="title">
            <wd-input v-model="formData.title" clearable placeholder="请输入标题" />
          </wd-form-item>
          <wd-form-item title="作者" title-width="220rpx" prop="author">
            <wd-input v-model="formData.author" clearable placeholder="请输入作者" />
          </wd-form-item>
          <wd-cell title="封面图片" is-link value="素材库选择" @click="materialPickerVisible = true" />
          <wd-cell title="本地上传" is-link value="从相册选择并上传" @click="handleUploadCover" />
          <view v-if="formData.thumbUrl" class="px-24rpx py-16rpx">
            <wd-img :src="formData.thumbUrl" width="240rpx" height="240rpx" mode="aspectFit" radius="8rpx" enable-preview />
          </view>
          <wd-form-item title="摘要" title-width="220rpx" prop="digest">
            <wd-textarea v-model="formData.digest" clearable placeholder="请输入摘要" :maxlength="120" show-word-limit />
          </wd-form-item>
          <wd-form-item title="原文地址" title-width="220rpx" prop="contentSourceUrl">
            <wd-input v-model="formData.contentSourceUrl" clearable placeholder="请输入原文地址" />
          </wd-form-item>
          <wd-form-item title="显示封面" title-width="220rpx" prop="showCoverPic" center>
            <wd-switch v-model="formData.showCoverPic" :active-value="1" :inactive-value="0" />
          </wd-form-item>
          <wd-form-item title="打开评论" title-width="220rpx" prop="needOpenComment" center>
            <wd-switch v-model="formData.needOpenComment" :active-value="1" :inactive-value="0" />
          </wd-form-item>
          <wd-form-item title="仅粉丝可评论" title-width="220rpx" prop="onlyFansCanComment" center>
            <wd-switch v-model="formData.onlyFansCanComment" :active-value="1" :inactive-value="0" />
          </wd-form-item>
          <wd-form-item title="正文" title-width="220rpx" prop="content">
            <wd-textarea v-model="formData.content" clearable placeholder="请输入正文 HTML 或文本（正文配图请在 PC 端插入）" :maxlength="20000" />
          </wd-form-item>
        </wd-cell-group>

        <!-- 正文预览 -->
        <wd-cell-group v-if="formData.content" border title="正文预览">
          <view class="px-24rpx py-16rpx">
            <rich-text :nodes="formData.content" />
          </view>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 封面素材选择 -->
    <MaterialPicker
      v-model:visible="materialPickerVisible"
      :account-id="accountId"
      type="image"
      @select="handleCoverSelect"
    />

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { parseId } from '@/utils/id'

import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { NewsItem } from '@/api/mp/draft'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createDraft, createEmptyNewsItem, updateDraft } from '@/api/mp/draft'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import MaterialPicker from '@/pages-mp/material/components/material-picker.vue'
import { useMaterialUpload } from '@/pages-mp/utils/upload'

const props = defineProps<{
  accountId?: number | any
  mediaId?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const accountId = computed(() => props.accountId ? parseId(props.accountId) : undefined)
const mediaId = computed(() => props.mediaId || '')
const getTitle = computed(() => mediaId.value ? '编辑公众号草稿' : '新增公众号草稿')
const isCreating = computed(() => !mediaId.value) // 仅新建态可增删图文（编辑走 updateDraft 按 index 改写，增删会保存失败/微信端残留）
const formLoading = ref(false) // 表单提交状态
const formData = ref<NewsItem>(createEmptyNewsItem()) // 表单数据
const articles = ref<NewsItem[]>([formData.value]) // 图文列表
const activeIndex = ref(0) // 当前图文索引
const formSchema = createFormSchema({
  title: [{ required: true, message: '标题不能为空' }],
  content: [{ required: true, message: '正文不能为空' }],
  // 注：封面 thumbMediaId 渲染为 wd-cell（无 wd-form-item），不入 schema；缺封面由 handleSubmit 的「第 N 篇未填写完整」守卫提示
})
const formRef = ref<FormInstance>() // 表单组件引用
const materialPickerVisible = ref(false) // 封面素材选择弹窗
const { chooseAndUpload } = useMaterialUpload()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/draft/index')
}

/** 选择封面图片 */
function handleCoverSelect(item: any) {
  formData.value.thumbMediaId = item.mediaId || ''
  formData.value.thumbUrl = item.url || ''
}

/** 本地上传封面图片 */
async function handleUploadCover() {
  if (!accountId.value) {
    toast.show('缺少公众号编号')
    return
  }
  const material = await chooseAndUpload('image', { accountId: accountId.value, permanent: true })
  if (!material) {
    return
  }
  formData.value.thumbMediaId = material.mediaId || ''
  formData.value.thumbUrl = material.url || ''
}

/** 加载编辑数据 */
function getDetail() {
  if (!mediaId.value) {
    return
  }
  const draft = uni.getStorageSync('mp:draft:edit')
  // 校验缓存与当前 mediaId 一致，避免编辑到上一条残留草稿
  if (!draft || draft.mediaId !== mediaId.value) {
    return
  }
  const articles = draft?.content?.newsItem || []
  setArticles(articles.length > 0 ? articles : [createEmptyNewsItem()])
  uni.removeStorageSync('mp:draft:edit')
}

/** 设置图文列表 */
function setArticles(value: NewsItem[]) {
  articles.value = value.map(item => ({
    ...createEmptyNewsItem(),
    ...item,
  }))
  activeIndex.value = 0
  formData.value = articles.value[0]
}

/** 切换图文 */
function handleSwitchArticle(index: number) {
  activeIndex.value = index
  formData.value = articles.value[index]
}

/** 新增图文 */
function handleAddArticle() {
  const article = createEmptyNewsItem()
  articles.value.push(article)
  handleSwitchArticle(articles.value.length - 1)
}

/** 移动图文 */
function handleMoveArticle(index: number, offset: number) {
  const targetIndex = index + offset
  if (targetIndex < 0 || targetIndex >= articles.value.length) {
    return
  }
  const current = articles.value[index]
  articles.value[index] = articles.value[targetIndex]
  articles.value[targetIndex] = current
  handleSwitchArticle(targetIndex)
}

/** 删除图文 */
function handleRemoveArticle(index = activeIndex.value) {
  if (!isCreating.value || articles.value.length <= 1) {
    return
  }
  articles.value.splice(index, 1)
  handleSwitchArticle(Math.min(index, articles.value.length - 1))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (!accountId.value) {
    toast.show('缺少公众号编号')
    return
  }
  const invalidIndex = articles.value.findIndex(item => !item.title || !item.thumbMediaId || !item.content)
  if (invalidIndex >= 0) {
    handleSwitchArticle(invalidIndex)
    toast.show(`第 ${invalidIndex + 1} 篇图文未填写完整`)
    return
  }

  formLoading.value = true
  try {
    if (mediaId.value) {
      await updateDraft(accountId.value, mediaId.value, articles.value)
      toast.success('修改成功')
    } else {
      await createDraft(accountId.value, articles.value)
      toast.success('新增成功')
    }
    uni.$emit('mp:draft:reload')
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
