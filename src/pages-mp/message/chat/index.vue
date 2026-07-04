<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="粉丝消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 粉丝信息 -->
    <view class="shrink-0 bg-white px-24rpx py-20rpx">
      <view class="flex items-center gap-16rpx">
        <wd-img
          v-if="userInfo.headImageUrl"
          :src="userInfo.headImageUrl"
          width="72rpx"
          height="72rpx"
          mode="aspectFill"
          round
        />
        <view
          v-else
          class="h-72rpx w-72rpx flex items-center justify-center rounded-full bg-[#07c160] text-28rpx text-white"
        >
          {{ (userInfo.nickname || '粉')?.charAt(0) }}
        </view>
        <view class="min-w-0 flex-1">
          <view class="truncate text-30rpx text-[#333] font-semibold">
            {{ userInfo.nickname || '微信用户' }}
          </view>
          <view class="truncate text-24rpx text-[#999]">
            {{ userInfo.openid || routeOpenid || '-' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 消息会话 -->
    <scroll-view
      scroll-y
      class="min-h-0 flex-1 bg-[#f3f5f7]"
      :scroll-into-view="scrollIntoView"
    >
      <view class="px-24rpx py-20rpx">
        <view class="mb-20rpx text-center">
          <wd-button
            v-if="hasMore"
            size="small"
            variant="plain"
            :loading="loading"
            @click="loadMore"
          >
            加载更多
          </wd-button>
          <text v-else class="text-24rpx text-[#999]">
            没有更多了
          </text>
        </view>

        <view
          v-for="(item, index) in list"
          :id="getMessageDomId(item, index)"
          :key="item.id || index"
          class="mb-24rpx"
        >
          <view class="mb-8rpx text-center text-22rpx text-[#999]">
            {{ formatDateTime(item.createTime) || '-' }}
          </view>
          <view
            class="flex gap-12rpx"
            :class="item.sendFrom === 2 ? 'flex-row-reverse' : 'flex-row'"
          >
            <view
              class="h-64rpx w-64rpx flex shrink-0 items-center justify-center rounded-full text-24rpx text-white"
              :class="item.sendFrom === 2 ? 'bg-[#1890ff]' : 'bg-[#07c160]'"
            >
              {{ item.sendFrom === 2 ? '号' : '粉' }}
            </view>
            <view
              class="max-w-[560rpx] rounded-12rpx px-20rpx py-16rpx text-28rpx shadow-sm"
              :class="item.sendFrom === 2 ? 'bg-[#dff5d8] text-[#1f1f1f]' : 'bg-white text-[#333]'"
            >
              <ReplyContent
                :type="item.type"
                :content="item.content"
                :media-url="item.mediaUrl"
                :recognition="item.recognition"
                :format="item.format"
                :title="item.title"
                :description="item.description"
                :url="item.url"
                :event="item.event"
                :event-key="item.eventKey"
                :articles="item.articles"
                :thumb-media-url="item.thumbMediaUrl"
                :music-url="item.musicUrl"
                :hq-music-url="item.hqMusicUrl"
                :location-x="item.locationX"
                :location-y="item.locationY"
                :scale="item.scale"
                :label="item.label"
              />
            </view>
          </view>
        </view>
        <view id="message-bottom" class="h-1rpx" />
      </view>
    </scroll-view>

    <!-- 发送区域 -->
    <view class="shrink-0 border-t border-[#eee] bg-white px-24rpx py-20rpx pb-[calc(20rpx+env(safe-area-inset-bottom))]">
      <view class="mb-16rpx flex items-center gap-16rpx">
        <wd-button size="small" variant="plain" @click="sendTypePickerVisible = true">
          <view class="flex items-center gap-4rpx">
            <text>{{ sendTypeLabel }}</text>
            <wd-icon name="down" size="24rpx" />
          </view>
        </wd-button>
        <wd-button v-if="canUpload" size="small" variant="plain" :loading="uploading" @click="handleUpload">
          本地上传
        </wd-button>
        <wd-button
          v-if="canPickMaterial"
          size="small"
          variant="plain"
          @click="materialPickerVisible = true"
        >
          {{ sendForm.type === 'music' ? '选缩略图' : '素材库' }}
        </wd-button>
      </view>
      <wd-picker
        v-model:visible="sendTypePickerVisible"
        :model-value="[sendForm.type]"
        :columns="sendTypeOptions"
        @confirm="handleSendTypeConfirm"
      />

      <!-- 文本 -->
      <template v-if="sendForm.type === 'text'">
        <wd-textarea
          v-model="sendForm.content"
          placeholder="请输入消息内容"
          :maxlength="600"
          show-word-limit
          clearable
        />
      </template>

      <!-- 图片 -->
      <template v-else-if="sendForm.type === 'image'">
        <view v-if="sendForm.url" class="flex items-center gap-16rpx">
          <wd-img :src="sendForm.url" width="160rpx" height="160rpx" radius="8rpx" mode="aspectFill" />
          <wd-button size="small" type="danger" variant="plain" @click="clearMedia">
            移除
          </wd-button>
        </view>
        <view v-else class="text-26rpx text-[#999]">
          请「本地上传」或从「素材库」选择图片
        </view>
      </template>

      <!-- 语音 -->
      <template v-else-if="sendForm.type === 'voice'">
        <view v-if="sendForm.url" class="flex items-center gap-16rpx">
          <MediaPreview type="voice" :url="sendForm.url" />
          <wd-button size="small" type="danger" variant="plain" @click="clearMedia">
            移除
          </wd-button>
        </view>
        <view v-else class="text-26rpx text-[#999]">
          请「本地上传」或从「素材库」选择语音
        </view>
      </template>

      <!-- 视频 -->
      <template v-else-if="sendForm.type === 'video'">
        <MediaPreview v-if="sendForm.url" type="video" :url="sendForm.url" />
        <view v-else class="text-26rpx text-[#999]">
          请「本地上传」或从「素材库」选择视频
        </view>
        <view class="h-12rpx" />
        <wd-input v-model="sendForm.title" clearable placeholder="请输入视频标题" />
        <view class="h-12rpx" />
        <wd-textarea v-model="sendForm.description" clearable placeholder="请输入视频描述" />
      </template>

      <!-- 图文 -->
      <template v-else-if="sendForm.type === 'news'">
        <NewsCard
          v-if="sendForm.articles.length"
          :articles="sendForm.articles"
          @article-click="article => openUrl(article.url)"
        />
        <view v-else class="text-26rpx text-[#999]">
          请从「素材库」选择图文（最多发送 1 条）
        </view>
        <view v-if="sendForm.articles.length" class="mt-12rpx text-right">
          <wd-button size="small" type="danger" variant="plain" @click="sendForm.articles = []">
            移除图文
          </wd-button>
        </view>
      </template>

      <!-- 音乐 -->
      <template v-else-if="sendForm.type === 'music'">
        <view v-if="sendForm.thumbMediaUrl" class="mb-12rpx flex items-center gap-16rpx">
          <wd-img :src="sendForm.thumbMediaUrl" width="120rpx" height="120rpx" radius="8rpx" mode="aspectFill" />
          <wd-button size="small" type="danger" variant="plain" @click="clearMusicThumb">
            移除缩略图
          </wd-button>
        </view>
        <view v-else class="mb-12rpx text-26rpx text-[#999]">
          请「本地上传」或「选缩略图」回填音乐封面
        </view>
        <wd-input v-model="sendForm.title" clearable placeholder="请输入标题" />
        <view class="h-12rpx" />
        <wd-textarea v-model="sendForm.description" clearable placeholder="请输入描述" />
        <view class="h-12rpx" />
        <wd-input v-model="sendForm.musicUrl" clearable placeholder="请输入音乐链接" />
        <view class="h-12rpx" />
        <wd-input v-model="sendForm.hqMusicUrl" clearable placeholder="请输入高质量音乐链接（选填）" />
      </template>

      <wd-button class="mt-16rpx" type="primary" block :loading="sending" @click="handleSend">
        发送
      </wd-button>
    </view>

    <!-- 素材选择 -->
    <MaterialPicker
      v-model:visible="materialPickerVisible"
      :account-id="accountId"
      :type="materialPickerType"
      @select="handleMaterialSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MpArticle, MpMessage, MpMessageSend } from '@/api/mp/message'
import type { MpUser } from '@/api/mp/user'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { getMessagePage, sendMessage } from '@/api/mp/message'
import { getUser } from '@/api/mp/user'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import MediaPreview from '@/pages-mp/components/media-preview.vue'
import NewsCard from '@/pages-mp/components/news-card.vue'
import MaterialPicker from '@/pages-mp/material/components/material-picker.vue'
import { openUrl } from '@/utils/url'
import { useMaterialUpload } from '@/pages-mp/utils/upload'
import ReplyContent from '../../components/reply-content.vue'

const props = defineProps<{
  userId?: number | string
  accountId?: number | string
  openid?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { uploading, chooseAndUpload } = useMaterialUpload()
const userId = computed(() => props.userId ? Number(props.userId) : undefined)
const routeAccountId = computed(() => props.accountId ? Number(props.accountId) : undefined)
const routeOpenid = computed(() => props.openid || '')
const accountId = ref<number>() // 当前公众号编号
const userInfo = reactive<MpUser>({
  id: undefined,
  nickname: '',
  openid: '',
  headImageUrl: '',
}) // 粉丝信息
const list = ref<MpMessage[]>([]) // 消息列表
const pageNo = ref(1) // 当前页码
const pageSize = 14 // 每页条数
const loading = ref(false) // 加载状态
const hasMore = ref(true) // 是否还有更多
const scrollIntoView = ref('message-bottom') // 滚动锚点
const sending = ref(false) // 发送状态
const sendTypePickerVisible = ref(false) // 类型选择器
const materialPickerVisible = ref(false) // 素材选择弹窗
const sendForm = reactive({
  type: 'text',
  content: '',
  mediaId: '',
  url: '',
  title: '',
  description: '',
  articles: [] as MpArticle[],
  thumbMediaId: '',
  thumbMediaUrl: '',
  musicUrl: '',
  hqMusicUrl: '',
}) // 发送表单
const sendTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'voice', label: '语音' },
  { value: 'video', label: '视频' },
  { value: 'news', label: '图文' },
  { value: 'music', label: '音乐' },
]

const sendTypeLabel = computed(() => sendTypeOptions.find(item => item.value === sendForm.type)?.label || '')
const canPickMaterial = computed(() => ['image', 'voice', 'video', 'news', 'music'].includes(sendForm.type))
// 本地上传：图片 / 语音 / 视频内联上传，音乐上传缩略图（thumb）
const canUpload = computed(() => ['image', 'voice', 'video', 'music'].includes(sendForm.type))
const materialPickerType = computed<'image' | 'voice' | 'video' | 'news'>(() => {
  if (sendForm.type === 'news') {
    return 'news'
  }
  if (sendForm.type === 'voice') {
    return 'voice'
  }
  if (sendForm.type === 'video') {
    return 'video'
  }
  // 图片 + 音乐（音乐选图片素材作为缩略图）
  return 'image'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/message/index')
}

/** 初始化粉丝信息 */
async function initUser() {
  accountId.value = routeAccountId.value
  userInfo.openid = routeOpenid.value
  if (!userId.value) {
    return
  }
  try {
    const data = await getUser(userId.value)
    Object.assign(userInfo, data)
    accountId.value = data.accountId || accountId.value
  } catch {
    // 请求层已提示错误，保留路由携带的基础信息
  }
}

/** 获取消息 DOM 编号 */
function getMessageDomId(item: MpMessage, index: number) {
  return `message-${item.id || index}`
}

/** 加载消息 */
async function getList(reset = false) {
  if (!userId.value) {
    return
  }
  if (loading.value) {
    return
  }
  if (reset) {
    pageNo.value = 1
    list.value = []
    hasMore.value = true
  }
  loading.value = true
  try {
    const data = await getMessagePage({
      pageNo: pageNo.value,
      pageSize,
      userId: userId.value,
      accountId: accountId.value,
    })
    const messages = (data.list || []).reverse()
    list.value = reset ? messages : [...messages, ...list.value]
    hasMore.value = messages.length >= pageSize
    await nextTick()
    if (reset) {
      scrollIntoView.value = 'message-bottom'
    } else if (messages.length > 0) {
      scrollIntoView.value = getMessageDomId(messages[messages.length - 1], messages.length - 1)
    }
  } catch {
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

/** 加载更多 */
function loadMore() {
  if (!hasMore.value || loading.value) {
    return
  }
  pageNo.value += 1
  getList()
}

/** 消息类型选择 */
function handleSendTypeConfirm({ value }: { value: string[] }) {
  sendForm.type = value[0]
  // 切换消息类型时清空旧字段，避免跨类型残留
  clearSendForm()
}

/** 本地上传：图片 / 语音 / 视频回填 mediaId + 预览，音乐回填缩略图 */
async function handleUpload() {
  if (!accountId.value) {
    toast.show('缺少公众号编号')
    return
  }
  const uploadType = sendForm.type === 'music' ? 'thumb' : (sendForm.type as 'image' | 'voice' | 'video')
  const material = await chooseAndUpload(uploadType, { accountId: accountId.value, permanent: false })
  if (!material) {
    return
  }
  if (sendForm.type === 'music') {
    sendForm.thumbMediaId = material.mediaId || ''
    sendForm.thumbMediaUrl = material.url || ''
    return
  }
  sendForm.mediaId = material.mediaId || ''
  sendForm.url = material.url || ''
}

/** 选择素材 */
function handleMaterialSelect(item: any) {
  // 图文：回填 articles 数组，预览用 news-card
  if (sendForm.type === 'news') {
    sendForm.articles = normalizeArticles(getNewsArticles(item))
    return
  }
  // 音乐：选图片素材作为缩略图
  if (sendForm.type === 'music') {
    sendForm.thumbMediaId = item.mediaId || ''
    sendForm.thumbMediaUrl = item.url || ''
    return
  }
  sendForm.mediaId = item.mediaId || ''
  sendForm.url = item.url || ''
  // 视频：素材自带标题 / 描述时回填
  if (sendForm.type === 'video') {
    sendForm.title = item.title || sendForm.title
    sendForm.description = item.introduction || item.description || sendForm.description
  }
}

/** 获取素材图文列表 */
function getNewsArticles(item: any) {
  return item?.content?.newsItem || item?.articles || []
}

/** 规整图文字段，满足后端 Article 结构 */
function normalizeArticles(articles: MpArticle[]) {
  return articles.map(article => ({
    ...article,
    title: article.title || '',
    description: article.description || article.digest || '',
    picUrl: article.picUrl || article.thumbUrl || article.thumbMediaUrl || '',
    url: article.url || article.contentSourceUrl || '',
  }))
}

/** 移除已选媒体 */
function clearMedia() {
  sendForm.mediaId = ''
  sendForm.url = ''
}

/** 移除音乐缩略图 */
function clearMusicThumb() {
  sendForm.thumbMediaId = ''
  sendForm.thumbMediaUrl = ''
}

/** 清空发送内容 */
function clearSendForm() {
  sendForm.content = ''
  sendForm.mediaId = ''
  sendForm.url = ''
  sendForm.title = ''
  sendForm.description = ''
  sendForm.articles = []
  sendForm.thumbMediaId = ''
  sendForm.thumbMediaUrl = ''
  sendForm.musicUrl = ''
  sendForm.hqMusicUrl = ''
}

/** 发送消息 */
async function handleSend() {
  if (!userId.value) {
    toast.show('缺少粉丝编号')
    return
  }
  if (sendForm.type === 'text' && !sendForm.content) {
    toast.show('请输入消息内容')
    return
  }
  if (['image', 'voice', 'video'].includes(sendForm.type) && !sendForm.mediaId) {
    toast.show('请上传或从素材库选择素材')
    return
  }
  if (sendForm.type === 'video' && (!sendForm.title || !sendForm.description)) {
    toast.show('请填写视频标题与描述')
    return
  }
  if (sendForm.type === 'music' && (!sendForm.thumbMediaId || !sendForm.musicUrl)) {
    toast.show('请上传音乐缩略图并填写音乐链接')
    return
  }

  let articles: MpArticle[] | undefined
  if (sendForm.type === 'news') {
    if (!sendForm.articles.length) {
      toast.show('请从素材库选择图文素材')
      return
    }
    // 客服图文消息只允许发送 1 条
    articles = sendForm.articles.length > 1 ? [sendForm.articles[0]] : sendForm.articles
    if (sendForm.articles.length > 1) {
      toast.show('客服图文消息最多发送 1 条，已保留第一条')
    }
  }

  const data: MpMessageSend = {
    userId: userId.value,
    accountId: accountId.value,
    type: sendForm.type,
    content: sendForm.content,
    mediaId: sendForm.mediaId,
    url: sendForm.url,
    title: sendForm.title,
    description: sendForm.description,
    thumbMediaId: sendForm.thumbMediaId,
    thumbMediaUrl: sendForm.thumbMediaUrl,
    musicUrl: sendForm.musicUrl,
    hqMusicUrl: sendForm.hqMusicUrl,
  }
  if (articles) {
    data.articles = articles
  }

  sending.value = true
  try {
    const message = await sendMessage(data)
    list.value = [...list.value, message]
    clearSendForm()
    await nextTick()
    scrollIntoView.value = 'message-bottom'
    toast.success('发送成功')
  } finally {
    sending.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await initUser()
  await getList(true)
})
</script>
