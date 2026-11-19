<template>
  <view class="pb-160rpx">
    <!-- 剧本已修改提示 -->
    <view v-if="detail.project.status === AiDramaProjectStatusEnum.SCRIPT_CHANGED" class="m-24rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#d46b08] leading-40rpx">
      剧本已修改：请重新分析资产、拆分分镜后，再生成关键帧和镜头视频；原有资产保留
    </view>

    <!-- 当前版本与版本历史 -->
    <view class="flex items-center justify-between gap-12rpx bg-white px-24rpx py-20rpx">
      <view class="min-w-0 flex-1 text-24rpx text-[#999]">
        <view v-if="detail.script" class="truncate">
          当前版本 · {{ formatDateTime(detail.script.createTime) }}
          <text v-if="detail.script.revisionNote"> · 打磨：{{ detail.script.revisionNote }}</text>
        </view>
        <view v-else>
          尚无剧本：可直接编写正文后保存，或回到上一步生成
        </view>
      </view>
      <wd-button size="small" variant="plain" :disabled="!versions.length" @click="historyVisible = true">
        版本历史（{{ versions.length }}）
      </wd-button>
    </view>

    <!-- 剧本表单 -->
    <wd-form :model="formData">
      <wd-cell-group border>
        <wd-form-item title="剧名" title-width="180rpx">
          <wd-input v-model="formData.title" :maxlength="128" clearable placeholder="请输入剧名" />
        </wd-form-item>
        <wd-form-item title="叙事基调" title-width="180rpx">
          <wd-input v-model="formData.tone" :maxlength="255" clearable placeholder="请输入叙事基调" />
        </wd-form-item>
        <wd-form-item title="剧情大纲" title-width="180rpx" layout="vertical">
          <wd-textarea v-model="formData.outline" :maxlength="5000" show-word-limit auto-height placeholder="请输入剧情大纲" />
        </wd-form-item>
        <wd-form-item title="剧本正文" title-width="180rpx" layout="vertical">
          <view class="w-full">
            <view class="mb-12rpx flex justify-end">
              <wd-segmented v-model:value="contentMode" :options="CONTENT_MODES" />
            </view>
            <view v-if="contentMode === CONTENT_MODES[0]" class="min-h-200rpx whitespace-pre-wrap break-all rounded-8rpx bg-[#f8f8f8] p-20rpx text-28rpx text-[#333] leading-44rpx">
              {{ formData.content || '暂无正文，切换到「编辑」直接编写' }}
            </view>
            <wd-textarea v-else v-model="formData.content" auto-height placeholder="可直接编写，或在上一步生成" />
          </view>
        </wd-form-item>
      </wd-cell-group>

      <!-- 打磨剧本：按意见重写后新增版本，留在本页查看 -->
      <view v-if="polishVisible" class="mt-16rpx">
        <wd-cell-group border>
          <wd-form-item title="修改意见" title-width="180rpx" layout="vertical">
            <wd-textarea
              v-model="note"
              :maxlength="1000"
              show-word-limit
              auto-height
              placeholder="例如：结尾加一个反转；台词更口语化"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="chatModelId"
            label="对话模型"
            label-width="180rpx"
            placeholder="默认对话模型"
            :columns="chatModelList"
            label-key="name"
            value-key="id"
            clearable
          />
        </wd-cell-group>
        <view class="bg-white p-24rpx">
          <wd-button
            block
            variant="plain"
            :loading="polishing"
            :disabled="(busy && !polishing) || !note.trim()"
            @click="handlePolish"
          >
            按意见重写
          </wd-button>
        </view>
      </view>

      <!-- 更多剧本信息：默认折叠 -->
      <wd-collapse v-model="moreActive" class="mt-16rpx">
        <wd-collapse-item name="more" title="更多剧本信息（世界观 · 原始素材）">
          <wd-cell-group border>
            <wd-form-item title="世界观" title-width="180rpx" layout="vertical">
              <wd-textarea
                v-model="formData.worldbuilding"
                auto-height
                placeholder="时代、地点、规则等设定，生成、打磨剧本时沿用"
              />
            </wd-form-item>
            <wd-form-item title="原始素材" title-width="180rpx" layout="vertical">
              <wd-textarea
                v-model="formData.sourceMaterial"
                auto-height
                placeholder="改编的小说片段、新闻等原始素材，可不填"
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-collapse-item>
      </wd-collapse>
    </wd-form>

    <!-- 版本历史：生成、打磨都会新增版本，新的在前；点击只读查看 -->
    <wd-popup
      v-model="historyVisible"
      position="bottom"
      root-portal
      safe-area-inset-bottom
      custom-style="max-height: 70vh; border-radius: 32rpx 32rpx 0 0;"
    >
      <view class="p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-32rpx text-[#222] font-semibold">版本历史</text>
          <wd-icon name="close" size="36rpx" color="#999" @click="historyVisible = false" />
        </view>
        <scroll-view scroll-y class="max-h-[56vh]">
          <view
            v-for="item in versions"
            :key="item.id"
            class="mb-16rpx rounded-12rpx bg-[#f8f8f8] p-20rpx"
            @click="openVersion(item)"
          >
            <view class="flex items-center justify-between gap-12rpx">
              <text class="min-w-0 flex-1 truncate text-28rpx font-semibold" :class="item.id === detail.script?.id ? 'text-[#1677ff]' : 'text-[#333]'">
                {{ item.id === detail.script?.id ? '当前版本' : item.title || '剧本版本' }}
              </text>
              <text class="shrink-0 text-22rpx text-[#999]">{{ formatDateTime(item.createTime) }}</text>
            </view>
            <view v-if="item.revisionNote" class="mt-8rpx break-all text-24rpx text-[#999]">
              打磨：{{ item.revisionNote }}
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 剧本版本：只读查看；角色、场景、道具等资产为项目级，不随版本保存 -->
    <wd-popup
      v-model="versionVisible"
      position="bottom"
      root-portal
      safe-area-inset-bottom
      custom-style="height: 88vh; border-radius: 32rpx 32rpx 0 0;"
    >
      <view class="h-full flex flex-col p-24rpx">
        <view class="mb-16rpx flex items-center justify-between">
          <text class="text-32rpx text-[#222] font-semibold">
            剧本版本 · {{ formatDateTime(version?.createTime) }}{{ version?.id === detail.script?.id ? '（当前）' : '' }}
          </text>
          <wd-icon name="close" size="36rpx" color="#999" @click="versionVisible = false" />
        </view>
        <scroll-view v-if="version" scroll-y class="min-h-0 flex-1">
          <wd-cell-group border>
            <wd-cell title="剧名" :value="version.title || '-'" />
            <wd-cell title="叙事基调" :value="version.tone || '-'" />
            <wd-cell title="修订要求" layout="vertical" value-align="left">
              <text class="whitespace-pre-wrap break-all">{{ version.revisionNote || '-' }}</text>
            </wd-cell>
            <wd-cell title="剧情大纲" layout="vertical" value-align="left">
              <text class="whitespace-pre-wrap break-all">{{ version.outline || '-' }}</text>
            </wd-cell>
            <wd-cell title="世界观" layout="vertical" value-align="left">
              <text class="whitespace-pre-wrap break-all">{{ version.worldbuilding || '-' }}</text>
            </wd-cell>
            <wd-cell title="剧本正文" layout="vertical" value-align="left">
              <text class="whitespace-pre-wrap break-all">{{ version.content || '-' }}</text>
            </wd-cell>
          </wd-cell-group>

          <!-- 该版本的镜头 -->
          <view class="mb-12rpx mt-24rpx text-28rpx text-[#333] font-semibold">
            镜头（{{ versionStoryboards.length }}）
          </view>
          <view v-if="versionStoryboardLoading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
          <view v-for="item in versionStoryboards" :key="item.id" class="mb-12rpx rounded-12rpx bg-[#f8f8f8] p-20rpx">
            <view class="text-26rpx text-[#333] font-semibold">
              {{ item.sceneNo }}. {{ item.title || '未命名镜头' }}
            </view>
            <view class="mt-8rpx whitespace-pre-wrap break-all text-24rpx text-[#666] leading-38rpx">
              {{ item.sceneText || '-' }}
            </view>
          </view>
          <view v-if="!versionStoryboardLoading && !versionStoryboards.length" class="py-24rpx text-center text-24rpx text-[#999]">
            该版本没有镜头
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="w-full flex items-center gap-12rpx">
        <wd-button
          class="flex-1"
          variant="plain"
          block
          :disabled="busy || !detail.script?.content"
          @click="polishVisible = !polishVisible"
        >
          {{ polishVisible ? '收起打磨' : '打磨剧本' }}
        </wd-button>
        <wd-button
          class="flex-1"
          variant="plain"
          block
          :loading="saving"
          :disabled="busy && !saving"
          @click="handleSave"
        >
          保存剧本
        </wd-button>
        <wd-button
          class="flex-1"
          type="primary"
          block
          :loading="analyzing"
          :disabled="(busy && !analyzing) || !formData.content.trim()"
          @click="handleAnalyze"
        >
          保存并分析资产
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { DramaScript } from '@/api/ai/drama/script'
import type { DramaStoryboard } from '@/api/ai/drama/storyboard'
import type { AiModel } from '@/api/ai/model/model'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { analyzeDramaAssetList, getDramaScriptList, polishDramaScript, updateDramaScript } from '@/api/ai/drama/script'
import { getDramaStoryboardList } from '@/api/ai/drama/storyboard'
import { getModelSimpleList } from '@/api/ai/model/model'
import { AiDramaProjectStatusEnum, AiDramaStepEnum, AiModelTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
}>()

const emit = defineEmits<{
  refresh: []
  next: [step: number]
}>()

const CONTENT_MODES = ['阅读', '编辑'] // 正文的阅读、编辑切换

const toast = useToast()
const formData = ref({ // 剧本表单
  title: '',
  tone: '',
  outline: '',
  worldbuilding: '',
  sourceMaterial: '',
  content: '',
})
const versions = ref<DramaScript[]>([]) // 剧本版本，新的在前
const historyVisible = ref(false) // 版本历史弹窗
const versionVisible = ref(false) // 版本查看弹窗
const version = ref<DramaScript>() // 只读查看的剧本版本
const versionStoryboards = ref<DramaStoryboard[]>([]) // 只读查看的剧本版本的镜头
const versionStoryboardLoading = ref(false) // 版本镜头加载状态
const chatModelList = ref<AiModel[]>([]) // 对话模型
const chatModelId = ref<number>() // 打磨、分析使用的对话模型
const note = ref('') // 修改意见
const polishVisible = ref(false) // 是否展开打磨的修改意见
const moreActive = ref<string[]>([]) // 更多剧本信息展开状态
const contentMode = ref(props.detail.script?.content ? CONTENT_MODES[0] : CONTENT_MODES[1]) // 正文模式：有正文时默认阅读
const saving = ref(false) // 保存状态
const polishing = ref(false) // 打磨状态
const analyzing = ref(false) // 分析状态
const busy = computed(() => saving.value || polishing.value || analyzing.value) // 保存、打磨、分析互斥

/** 剧本内容变化（保存、打磨）时同步到表单；生成中的轮询返回的剧本未变，不覆盖正在编辑的内容 */
watch(
  [
    () => props.detail.script?.title,
    () => props.detail.script?.tone,
    () => props.detail.script?.outline,
    () => props.detail.script?.worldbuilding,
    () => props.detail.script?.sourceMaterial,
    () => props.detail.script?.content,
  ],
  ([title, tone, outline, worldbuilding, sourceMaterial, content]) => {
    formData.value = {
      title: title || '',
      tone: tone || '',
      outline: outline || '',
      worldbuilding: worldbuilding || '',
      sourceMaterial: sourceMaterial || '',
      content: content || '',
    }
  },
  { immediate: true },
)

/** 剧本版本变化（生成、打磨）时重新加载版本列表 */
watch(
  () => props.detail.script?.id,
  async (id) => {
    versions.value = id ? await getDramaScriptList(props.detail.project.id) : []
  },
  { immediate: true },
)

/** 打开剧本版本：只读查看正文与该版本的镜头 */
async function openVersion(item: DramaScript) {
  version.value = item
  versionVisible.value = true
  versionStoryboards.value = []
  versionStoryboardLoading.value = true
  try {
    const list = await getDramaStoryboardList(item.id)
    // 连续切换版本时，只保留最后打开的版本的结果
    if (version.value?.id === item.id) {
      versionStoryboards.value = list
    }
  } finally {
    if (version.value?.id === item.id) {
      versionStoryboardLoading.value = false
    }
  }
}

/** 保存当前剧本：没有剧本时新增 */
async function save() {
  await updateDramaScript({
    id: props.detail.script?.id,
    projectId: props.detail.project.id,
    ...formData.value,
  })
}

/** 保存剧本 */
async function handleSave() {
  saving.value = true
  try {
    await save()
    toast.success('保存成功')
    emit('refresh')
  } finally {
    saving.value = false
  }
}

/** 打磨：先保存当前修改，再按意见重写为新版本，可能需要数十秒；完成后收起修改意见，留在本页阅读新版本 */
async function handlePolish() {
  polishing.value = true
  try {
    await save()
    await polishDramaScript(props.detail.project.id, note.value.trim(), chatModelId.value)
    note.value = ''
    polishVisible.value = false
    contentMode.value = CONTENT_MODES[0]
    toast.success('已生成新版本')
    emit('refresh')
  } finally {
    polishing.value = false
  }
}

/** 分析资产：先保存当前修改，再从剧本提取角色、场景、道具，可能需要数十秒；完成后进入资产配置 */
async function handleAnalyze() {
  analyzing.value = true
  try {
    await save()
    await analyzeDramaAssetList(props.detail.project.id, chatModelId.value)
    toast.success('资产分析完成')
    emit('next', AiDramaStepEnum.ASSET)
  } finally {
    analyzing.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  chatModelList.value = await getModelSimpleList(AiModelTypeEnum.CHAT)
})
</script>
