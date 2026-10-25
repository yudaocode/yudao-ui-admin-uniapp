<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文章详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <wd-cell-group border>
      <wd-cell title="编号" :value="formData.id != null ? String(formData.id) : '-'" />
      <wd-cell title="文章标题" :value="formData.title || '-'" />
      <wd-cell title="文章分类" :value="categoryName" />
      <wd-cell title="文章作者" :value="formData.author || '-'" />
      <wd-cell title="文章封面">
        <wd-img v-if="formData.picUrl" :src="formData.picUrl" width="112rpx" height="112rpx" radius="8rpx" mode="aspectFill" enable-preview />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="文章简介" :value="formData.introduction || '-'" />
      <wd-cell title="浏览量" :value="formData.browseCount != null ? String(formData.browseCount) : '-'" />
      <wd-cell title="排序" :value="formData.sort != null ? String(formData.sort) : '-'" />
      <wd-cell title="状态">
        <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
        <text v-else>-</text>
      </wd-cell>
      <wd-cell title="是否热门" :value="formData.recommendHot != null ? (formData.recommendHot ? '是' : '否') : '-'" />
      <wd-cell title="是否轮播" :value="formData.recommendBanner != null ? (formData.recommendBanner ? '是' : '否') : '-'" />
      <wd-cell title="文章内容" :value="formData.content || '-'" />
      <wd-cell title="创建时间" :value="formatDateTime(formData.createTime) || '-'" />
    </wd-cell-group>

    <!-- 底部操作按钮 -->
    <view v-if="hasAccessByCodes(['promotion:article:update', 'promotion:article:delete'])" class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['promotion:article:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button>
        <wd-button v-if="hasAccessByCodes(['promotion:article:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { PromotionArticle } from '@/api/mall/promotion/article'
import type { PromotionArticleCategory } from '@/api/mall/promotion/article-category'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deletePromotionArticle, getPromotionArticle } from '@/api/mall/promotion/article'
import { getSimplePromotionArticleCategoryList } from '@/api/mall/promotion/article-category'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const formData = ref<PromotionArticle>({} as PromotionArticle) // 详情数据
const deleting = ref(false) // 删除状态
const categories = ref<PromotionArticleCategory[]>([]) // 文章分类（按 id 解析名称）
const categoryName = computed(() => categories.value.find(c => c.id === formData.value.categoryId)?.name || '-') // 文章分类名

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mall/promotion/article/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    formData.value = await getPromotionArticle(props.id)
  } finally {
    toast.close()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-mall/promotion/article/form/index?id=${props.id}` })
}

/** 删除 */
async function handleDelete() {
  if (!props.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该文章吗？' })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deletePromotionArticle(props.id)
    toast.success('删除成功')
    uni.$emit('mall:promotion-article:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  categories.value = await getSimplePromotionArticleCategoryList()
  getDetail()
  uni.$on('mall:promotion-article:reload', getDetail)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mall:promotion-article:reload', getDetail)
})
</script>
