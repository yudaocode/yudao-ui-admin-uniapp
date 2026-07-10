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
        <wd-cell-group v-if="formData.type !== MpAutoReplyTypeEnum.FOLLOW" border title="请求配置">
          <template v-if="formData.type === MpAutoReplyTypeEnum.MESSAGE">
            <yd-form-picker
              v-model="formData.requestMessageType"
              label="消息类型"
              label-width="220rpx"
              prop="requestMessageType"
              :columns="requestMessageOptions"
              placeholder="请选择消息类型"
            />
          </template>
          <template v-if="formData.type === MpAutoReplyTypeEnum.KEYWORD">
            <wd-form-item title="关键词" title-width="220rpx" prop="requestKeyword">
              <wd-input v-model="formData.requestKeyword" clearable placeholder="请输入关键词" />
            </wd-form-item>
            <yd-form-picker
              v-model="formData.requestMatch"
              label="匹配类型"
              label-width="220rpx"
              prop="requestMatch"
              :dict-type="DICT_TYPE.MP_AUTO_REPLY_REQUEST_MATCH"
              placeholder="请选择匹配类型"
            />
          </template>
        </wd-cell-group>

        <wd-cell-group border title="回复配置">
          <yd-form-picker
            v-model="formData.responseMessageType"
            label="回复类型"
            label-width="220rpx"
            prop="responseMessageType"
            :columns="responseMessageOptions"
            placeholder="请选择回复类型"
          />

          <!-- 文本 -->
          <wd-form-item v-if="formData.responseMessageType === 'text'" title="回复内容" title-width="220rpx" prop="responseContent">
            <wd-textarea v-model="formData.responseContent" clearable placeholder="请输入回复内容" />
          </wd-form-item>

          <!-- 图片：素材库选择 / 本地上传 + 预览 -->
          <template v-else-if="formData.responseMessageType === 'image'">
            <wd-cell
              title="素材库"
              is-link
              :value="responseMaterialValue"
              @click="materialPickerVisible = true"
            />
            <wd-cell
              title="本地上传"
              is-link
              :value="uploading ? '上传中...' : '从本地选择并上传'"
              @click="handleUploadMaterial('image')"
            />
            <view v-if="formData.responseMediaUrl" class="px-24rpx py-16rpx">
              <wd-img :src="formData.responseMediaUrl" width="200rpx" height="200rpx" mode="aspectFill" radius="8rpx" />
            </view>
          </template>

          <!-- 语音：素材库选择 / 本地上传 + 预览 -->
          <template v-else-if="formData.responseMessageType === 'voice'">
            <wd-cell
              title="素材库"
              is-link
              :value="responseMaterialValue"
              @click="materialPickerVisible = true"
            />
            <wd-cell
              title="本地上传"
              is-link
              :value="uploading ? '上传中...' : '从本地选择并上传'"
              @click="handleUploadMaterial('voice')"
            />
            <view v-if="formData.responseMediaUrl" class="px-24rpx py-16rpx">
              <MediaPreview type="voice" :url="formData.responseMediaUrl" />
            </view>
          </template>

          <!-- 视频：标题 / 描述 + 素材库选择 / 本地上传 + 预览 -->
          <template v-else-if="formData.responseMessageType === 'video'">
            <wd-form-item title="标题" title-width="220rpx" prop="responseTitle">
              <wd-input v-model="formData.responseTitle" clearable placeholder="请输入标题" />
            </wd-form-item>
            <wd-form-item title="描述" title-width="220rpx" prop="responseDescription">
              <wd-textarea v-model="formData.responseDescription" clearable placeholder="请输入描述" />
            </wd-form-item>
            <wd-cell
              title="素材库"
              is-link
              :value="responseMaterialValue"
              @click="materialPickerVisible = true"
            />
            <wd-cell
              title="本地上传"
              is-link
              :value="uploading ? '上传中...' : '从本地选择并上传'"
              @click="handleUploadMaterial('video')"
            />
            <view v-if="formData.responseMediaUrl" class="px-24rpx py-16rpx">
              <MediaPreview type="video" :url="formData.responseMediaUrl" />
            </view>
          </template>

          <!-- 图文：素材库选择 + 卡片预览 -->
          <template v-else-if="formData.responseMessageType === 'news'">
            <wd-cell
              title="素材库"
              is-link
              :value="responseMaterialValue"
              @click="materialPickerVisible = true"
            />
            <view v-if="formData.responseArticles?.length" class="px-24rpx py-16rpx">
              <NewsCard :articles="formData.responseArticles" />
              <wd-button class="mt-16rpx" type="danger" size="small" variant="plain" block @click="handleDeleteResponseArticles">
                删除图文
              </wd-button>
            </view>
          </template>

          <!-- 音乐：缩略图（素材库 / 本地上传）+ 标题 / 描述 + 音乐链接 -->
          <template v-else-if="formData.responseMessageType === 'music'">
            <wd-cell
              title="素材库"
              is-link
              :value="responseMaterialValue"
              @click="materialPickerVisible = true"
            />
            <wd-cell
              title="本地上传"
              is-link
              :value="uploading ? '上传中...' : '从本地选择并上传'"
              @click="handleUploadMaterial('thumb')"
            />
            <view v-if="formData.responseThumbMediaUrl" class="px-24rpx py-16rpx">
              <wd-img :src="formData.responseThumbMediaUrl" width="200rpx" height="200rpx" mode="aspectFill" radius="8rpx" />
            </view>
            <wd-form-item title="标题" title-width="220rpx" prop="responseTitle">
              <wd-input v-model="formData.responseTitle" clearable placeholder="请输入标题" />
            </wd-form-item>
            <wd-form-item title="描述" title-width="220rpx" prop="responseDescription">
              <wd-textarea v-model="formData.responseDescription" clearable placeholder="请输入描述" />
            </wd-form-item>
            <wd-form-item title="音乐链接" title-width="220rpx" prop="responseMusicUrl">
              <wd-input v-model="formData.responseMusicUrl" clearable placeholder="请输入音乐链接" />
            </wd-form-item>
            <wd-form-item title="高质量链接" title-width="220rpx" prop="responseHqMusicUrl">
              <wd-input v-model="formData.responseHqMusicUrl" clearable placeholder="请输入高质量音乐链接" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 素材选择 -->
    <MaterialPicker
      v-model:visible="materialPickerVisible"
      :account-id="formData.accountId"
      :type="materialPickerType"
      @select="handleMaterialSelect"
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
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AutoReply } from '@/api/mp/autoReply'
import type { MpArticle } from '@/api/mp/message'
import type { MaterialUploadType } from '@/pages-mp/utils/upload'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { createAutoReply, getAutoReply, updateAutoReply } from '@/api/mp/autoReply'
import { getStrDictOptions } from '@/hooks/useDict'
import MediaPreview from '@/pages-mp/components/media-preview.vue'
import NewsCard from '@/pages-mp/components/news-card.vue'
import MaterialPicker from '@/pages-mp/material/components/material-picker.vue'
import { useMaterialUpload } from '@/pages-mp/utils/upload'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MpAutoReplyRequestMatchEnum, MpAutoReplyTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  accountId?: number | any
  type?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const URL_PATTERN = /^https?:\/\/.+/i // 音乐链接格式校验
const requestMessageTypes = ['text', 'image', 'voice', 'video', 'shortvideo', 'location', 'link']
const responseMessageTypes = ['text', 'image', 'voice', 'video', 'news', 'music']
const toast = useToast()
const { uploading, chooseAndUpload } = useMaterialUpload()
const accountId = computed(() => props.accountId ? Number(props.accountId) : undefined)
const replyType = computed(() => props.type ? Number(props.type) : MpAutoReplyTypeEnum.KEYWORD)
const getTitle = computed(() => props.id ? '编辑自动回复' : '新增自动回复')
const formLoading = ref(false) // 表单提交状态
const materialPickerVisible = ref(false) // 素材选择弹窗
const formData = ref<AutoReply>({
  id: undefined,
  accountId: accountId.value,
  type: replyType.value,
  requestKeyword: undefined,
  requestMatch: replyType.value === MpAutoReplyTypeEnum.KEYWORD ? MpAutoReplyRequestMatchEnum.ALL : undefined,
  requestMessageType: undefined,
  responseMessageType: 'text',
  responseContent: '',
  responseArticles: [],
}) // 表单数据
const formSchema = createFormSchema({
  requestKeyword: [{ required: () => formData.value.type === MpAutoReplyTypeEnum.KEYWORD, message: '关键词不能为空' }],
  requestMatch: [{ required: () => formData.value.type === MpAutoReplyTypeEnum.KEYWORD, message: '匹配类型不能为空' }],
  requestMessageType: [{ required: () => formData.value.type === MpAutoReplyTypeEnum.MESSAGE, message: '消息类型不能为空' }],
  responseMessageType: [{ required: true, message: '回复类型不能为空' }],
  responseContent: [{ required: () => formData.value.responseMessageType === 'text', message: '回复内容不能为空' }],
  responseTitle: [{ required: () => formData.value.responseMessageType === 'video', message: '视频标题不能为空' }],
  responseDescription: [{ required: () => formData.value.responseMessageType === 'video', message: '视频描述不能为空' }],
  responseMusicUrl: [
    { required: () => formData.value.responseMessageType === 'music', message: '音乐链接不能为空' },
    { pattern: URL_PATTERN, message: '音乐链接格式不正确' },
  ],
  responseHqMusicUrl: [
    { required: () => formData.value.responseMessageType === 'music', message: '高质量音乐链接不能为空' },
    { pattern: URL_PATTERN, message: '高质量音乐链接格式不正确' },
  ],
  // 注：responseMediaId / responseThumbMediaId / responseArticles 渲染为 wd-cell（无 wd-form-item），
  // wd-form 不会展示其 schema 错误，改由 handleSubmit 显式判空 toast，避免「保存」静默失败
})
const formRef = ref<FormInstance>() // 表单组件引用

const requestMessageOptions = computed(() => getStrDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter(item => requestMessageTypes.includes(String(item.value))))
const responseMessageOptions = computed(() => getStrDictOptions(DICT_TYPE.MP_MESSAGE_TYPE).filter(item => responseMessageTypes.includes(String(item.value))))
const materialPickerType = computed<'image' | 'voice' | 'video' | 'news'>(() => { // 音乐选图片素材作为缩略图，其余按自身类型选择
  const type = formData.value.responseMessageType
  return type === 'voice' || type === 'video' || type === 'news' ? type : 'image'
})
const responseMaterialValue = computed(() => { // 素材库选择状态文案
  const type = formData.value.responseMessageType
  if (type === 'news') {
    return formData.value.responseArticles?.length ? '重新选择图文' : '选择图文'
  }
  if (type === 'music') {
    return formData.value.responseThumbMediaUrl ? '重新选择' : '选择缩略图'
  }
  return formData.value.responseMediaUrl ? '重新选择' : '选择素材'
})

const ready = ref(false) // 详情回填完成后才允许换类型清字段，避免回填触发清空

/** 切换回复类型时清空与新类型无关的 response* 字段 */
watch(() => formData.value.responseMessageType, () => {
  if (!ready.value) {
    return
  }
  formData.value.responseContent = ''
  formData.value.responseMediaId = undefined
  formData.value.responseMediaUrl = undefined
  formData.value.responseTitle = undefined
  formData.value.responseDescription = undefined
  formData.value.responseThumbMediaId = undefined
  formData.value.responseThumbMediaUrl = undefined
  formData.value.responseMusicUrl = undefined
  formData.value.responseHqMusicUrl = undefined
  formData.value.responseArticles = []
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/auto-reply/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getAutoReply(Number(props.id))
  formData.value.responseArticles = formData.value.responseArticles || []
}

/** 本地上传素材并回填 */
async function handleUploadMaterial(type: MaterialUploadType) {
  const material = await chooseAndUpload(type, { accountId: formData.value.accountId!, permanent: false })
  if (!material) {
    return
  }
  applyMaterial(type === 'thumb' ? 'music' : formData.value.responseMessageType, material)
  toast.success('上传成功')
}

/** 选择素材 */
function handleMaterialSelect(item: any) {
  applyMaterial(formData.value.responseMessageType, item)
}

/** 删除已选图文 */
function handleDeleteResponseArticles() {
  formData.value.responseArticles = []
}

/** 把素材回填到对应回复字段（选择 / 上传共用） */
function applyMaterial(type: string | undefined, item: any) {
  if (type === 'news') {
    formData.value.responseArticles = normalizeArticles(getNewsArticles(item))
    return
  }
  // 音乐：素材作为缩略图
  if (type === 'music') {
    formData.value.responseThumbMediaId = item.mediaId || ''
    formData.value.responseThumbMediaUrl = item.url || ''
    return
  }
  // 图片 / 语音 / 视频：媒体素材
  formData.value.responseMediaId = item.mediaId || ''
  formData.value.responseMediaUrl = item.url || ''
  if (type === 'video') {
    formData.value.responseTitle = formData.value.responseTitle || item.title || item.name || ''
    formData.value.responseDescription = formData.value.responseDescription || item.introduction || item.description || ''
  }
}

/** 获取素材图文列表 */
function getNewsArticles(item: any): MpArticle[] {
  return item?.content?.newsItem || item?.articles || []
}

/** 规整图文字段，满足后端 responseArticles 结构 */
function normalizeArticles(articles: MpArticle[]) {
  return articles.map(article => ({
    ...article,
    title: article.title || '',
    description: article.description || article.digest || '',
    picUrl: article.picUrl || article.thumbUrl || article.thumbMediaUrl || '',
    url: article.url || article.contentSourceUrl || '',
  }))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 参数校验
  const responseType = formData.value.responseMessageType
  if (['image', 'voice', 'video'].includes(String(responseType)) && !formData.value.responseMediaId) {
    toast.show('请选择或上传素材')
    return
  }
  if (responseType === 'music' && !formData.value.responseThumbMediaId) {
    toast.show('请选择音乐缩略图')
    return
  }
  if (responseType === 'news' && !formData.value.responseArticles?.length) {
    toast.show('请选择图文素材')
    return
  }

  // 表单提交
  const data: AutoReply = { ...formData.value }
  data.id = props.id ? Number(props.id) : data.id
  if (!props.id) {
    data.accountId = accountId.value
    data.type = replyType.value
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateAutoReply(data)
      toast.success('修改成功')
    } else {
      await createAutoReply(data)
      toast.success('新增成功')
    }
    uni.$emit('mp:auto-reply:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  if (!props.id) {
    formData.value.accountId = accountId.value
    formData.value.type = replyType.value
    formData.value.requestMatch = replyType.value === MpAutoReplyTypeEnum.KEYWORD ? MpAutoReplyRequestMatchEnum.ALL : undefined
  }
  await getDetail()
  // 等回填触发的 watch 跑完再放开清字段
  await nextTick()
  ready.value = true
})
</script>
