<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 音乐"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink @change="handleTabChange">
        <wd-tab title="创作" />
        <wd-tab title="我的音乐" />
        <wd-tab title="音乐广场" />
      </wd-tabs>
    </view>

    <!-- 生成表单 -->
    <view v-show="tabIndex === 0" class="bg-white p-24rpx">
      <wd-form :model="formData">
        <wd-cell-group border>
          <wd-form-item title="生成模式" title-width="170rpx" center>
            <wd-radio-group v-model="formData.generateMode" type="button">
              <wd-radio v-for="item in modeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <yd-form-picker v-model="formData.model" label="模型" label-width="170rpx" :columns="modelOptions" placeholder="请选择模型" />

          <template v-if="formData.generateMode === MusicGenerateModeEnum.DESCRIPTION">
            <wd-form-item title="音乐说明" title-width="170rpx">
              <wd-textarea
                v-model="formData.prompt"
                placeholder="描述想要的音乐风格和主题"
                :maxlength="1200"
                show-word-limit
                clearable
              />
            </wd-form-item>
            <wd-form-item title="纯音乐" title-width="170rpx" center>
              <wd-switch v-model="formData.makeInstrumental" />
            </wd-form-item>
          </template>

          <template v-else>
            <wd-form-item title="歌曲名称" title-width="170rpx">
              <wd-input v-model="formData.title" clearable placeholder="请输入音乐或歌曲名称" />
            </wd-form-item>
            <wd-form-item title="歌词" title-width="170rpx">
              <wd-textarea
                v-model="formData.prompt"
                placeholder="请输入歌词，两节或 8 行左右效果更好"
                :maxlength="1200"
                show-word-limit
                clearable
              />
            </wd-form-item>
            <wd-form-item title="自定义风格" title-width="170rpx">
              <wd-input v-model="customTag" clearable placeholder="输入英文风格后添加" />
            </wd-form-item>
          </template>
        </wd-cell-group>
      </wd-form>

      <view v-if="formData.generateMode === MusicGenerateModeEnum.LYRIC" class="mt-20rpx">
        <view class="mb-12rpx text-26rpx text-[#666]">
          音乐风格
        </view>
        <view class="flex flex-wrap gap-12rpx">
          <wd-tag
            v-for="tag in styleTags"
            :key="tag"
            :type="formData.tags.includes(tag) ? 'primary' : 'default'"
            variant="plain"
            @click="handleToggleTag(tag)"
          >
            {{ tag }}
          </wd-tag>
          <wd-tag v-if="customTag" type="primary" variant="plain" @click="handleAddCustomTag">
            添加 {{ customTag }}
          </wd-tag>
        </view>
      </view>

      <view class="mt-24rpx">
        <wd-button block type="primary" :loading="generating" @click="handleGenerate">
          创作音乐
        </wd-button>
      </view>
    </view>

    <!-- 音乐列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无音乐记录"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <image
            v-if="item.imageUrl"
            class="h-360rpx w-full bg-[#f1f5f9]"
            :src="item.imageUrl"
            mode="aspectFill"
            @click="handlePreview(item.imageUrl)"
          />
          <view v-else class="h-260rpx flex items-center justify-center bg-[#f8fafc] text-26rpx text-[#999]">
            {{ item.errorMessage || '音乐生成中' }}
          </view>
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.title || '未命名音乐' }}
                </view>
                <view class="mt-8rpx text-22rpx text-[#999]">
                  {{ formatDateTime(item.createTime) }}
                </view>
              </view>
              <dict-tag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="item.status" />
            </view>

            <view class="line-clamp-3 text-26rpx text-[#666]">
              {{ item.prompt || item.gptDescriptionPrompt || item.errorMessage || '-' }}
            </view>
            <view class="mt-12rpx text-24rpx text-[#999]">
              {{ item.platform || '-' }} / {{ item.model || '-' }} / {{ getTagsText(item.tags) }}
            </view>

            <view class="mt-20rpx flex flex-wrap gap-12rpx">
              <wd-button v-if="item.audioUrl" size="small" variant="plain" @click="handleCopyUrl(item.audioUrl)">
                复制音频
              </wd-button>
              <wd-button v-if="item.videoUrl" size="small" variant="plain" @click="handleCopyUrl(item.videoUrl)">
                复制视频
              </wd-button>
              <wd-button v-if="item.imageUrl" size="small" variant="plain" @click="handleCopyUrl(item.imageUrl)">
                复制封面
              </wd-button>
              <wd-button
                v-if="tabIndex !== 2"
                size="small"
                type="danger"
                variant="plain"
                @click="handleDelete(item)"
              >
                删除
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { MusicGenerateReqVO, MusicVO } from '@/api/ai/music'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { reactive, ref } from 'vue'
import { deleteMusicMy, generateMusic, getMusicMyPage } from '@/api/ai/music'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { AiPlatformEnum } from '@/pages-ai/utils/constants'

const MusicGenerateModeEnum = {
  DESCRIPTION: 1,
  LYRIC: 2,
} as const
type MusicGenerateMode = typeof MusicGenerateModeEnum[keyof typeof MusicGenerateModeEnum]

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0)
const list = ref<MusicVO[]>([]) // 音乐列表
const pagingRef = ref<any>() // 分页组件引用
const generating = ref(false) // 音乐生成状态
const customTag = ref('') // 自定义风格
const formData = reactive({
  generateMode: MusicGenerateModeEnum.LYRIC as MusicGenerateMode,
  model: 'chirp-v3.5',
  prompt: '',
  makeInstrumental: false,
  title: '',
  tags: [] as string[],
}) // 音乐生成表单
const modeOptions = [
  { label: '描述模式', value: MusicGenerateModeEnum.DESCRIPTION },
  { label: '歌词模式', value: MusicGenerateModeEnum.LYRIC },
]
const modelOptions = [
  { label: 'Suno V3.5', value: 'chirp-v3.5' },
  { label: 'Suno V3', value: 'chirp-v3.0' },
]
const styleTags = ['rock', 'punk', 'jazz', 'soul', 'country', 'kidsmusic', 'pop']

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/index/index')
}

/** Tab 切换 */
function handleTabChange({ index }: { index: number }) {
  tabIndex.value = index
  pagingRef.value?.reload()
}

/** 查询音乐列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = { pageNo, pageSize, publicStatus: tabIndex.value === 2 }
    const data = await getMusicMyPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 切换音乐风格 */
function handleToggleTag(tag: string) {
  const index = formData.tags.indexOf(tag)
  if (index >= 0) {
    formData.tags.splice(index, 1)
  } else {
    formData.tags.push(tag)
  }
}

/** 添加自定义风格 */
function handleAddCustomTag() {
  const tag = customTag.value.trim()
  if (!tag) {
    return
  }
  if (!formData.tags.includes(tag)) {
    formData.tags.push(tag)
  }
  customTag.value = ''
}

/** 生成音乐 */
async function handleGenerate() {
  if (!formData.model) {
    toast.warning('请选择模型')
    return
  }
  if (!formData.prompt) {
    toast.warning(formData.generateMode === MusicGenerateModeEnum.DESCRIPTION ? '请输入音乐说明' : '请输入歌词')
    return
  }

  generating.value = true
  try {
    const data: MusicGenerateReqVO = {
      platform: AiPlatformEnum.SUNO,
      generateMode: formData.generateMode,
      prompt: formData.prompt,
      makeInstrumental: formData.generateMode === MusicGenerateModeEnum.DESCRIPTION ? formData.makeInstrumental : undefined,
      model: formData.model,
      tags: formData.generateMode === MusicGenerateModeEnum.LYRIC ? formData.tags : undefined,
      title: formData.generateMode === MusicGenerateModeEnum.LYRIC ? formData.title : undefined,
    }
    await generateMusic(data)
    toast.success('已提交音乐生成任务')
    pagingRef.value?.reload()
  } finally {
    generating.value = false
  }
}

/** 删除音乐记录 */
async function handleDelete(item: MusicVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: '确定要删除该音乐记录吗？' })
  } catch {
    return
  }
  await deleteMusicMy(item.id)
  toast.success('删除成功')
  pagingRef.value?.reload()
}

/** 预览封面 */
function handlePreview(url?: string) {
  if (!url) {
    return
  }
  uni.previewImage({ urls: [url] })
}

/** 复制资源地址 */
function handleCopyUrl(url?: string) {
  if (!url) {
    return
  }
  uni.setClipboardData({
    data: url,
    success: () => toast.success('已复制地址'),
  })
}

/** 获取风格文案 */
function getTagsText(tags?: string | string[]) {
  if (Array.isArray(tags)) {
    return tags.length > 0 ? tags.join('、') : '-'
  }
  return tags || '-'
}
</script>
