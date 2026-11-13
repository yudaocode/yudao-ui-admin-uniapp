<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="文件编辑"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 文件信息 -->
    <view class="shrink-0 bg-white px-24rpx py-20rpx">
      <view class="flex items-center gap-12rpx">
        <text class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
          {{ file?.name || '-' }}
        </text>
        <wd-tag v-if="file?.fileType" type="primary" variant="light">
          {{ file.fileType }}
        </wd-tag>
        <wd-tag v-if="file?.locked" type="warning" variant="light">
          固定
        </wd-tag>
      </view>
    </view>

    <!-- 编辑 / 预览切换：仅 Markdown 文件支持预览 -->
    <view v-if="isMarkdown" class="shrink-0 bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="编辑" />
        <wd-tab title="预览" />
      </wd-tabs>
    </view>

    <!-- 内容区域 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <!-- 有保存按钮时，底部留出固定保存栏的高度，内容可以滚动到底 -->
      <view class="p-24rpx" :class="{ 'pb-160rpx': canUpdate }">
        <view v-show="tabIndex === 0" class="rounded-12rpx bg-white p-16rpx">
          <wd-textarea
            v-model="content"
            auto-height
            compact
            :disabled="!canUpdate"
            placeholder="请输入文件内容"
            custom-style="--wot-textarea-inner-min-height: 640rpx; --wot-textarea-inner-font-size: 26rpx; --wot-textarea-inner-line-height: 42rpx;"
          />
        </view>
        <view v-if="isMarkdown && tabIndex === 1" class="rounded-12rpx bg-white p-24rpx">
          <YdMarkdown v-if="content" :content="content" />
          <wd-empty v-else icon="content" tip="暂无内容" />
        </view>
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view v-if="canUpdate" class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="saving"
        :disabled="!file"
        @click="handleSave"
      >
        保存内容
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { SkillFile } from '@/api/ai/skill'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getSkillFile, updateSkillFileContent } from '@/api/ai/skill'
import { useAccess } from '@/hooks/useAccess'
import YdMarkdown from '@/pages-ai/components/yd-markdown/yd-markdown.vue'
import { navigateBackPlus } from '@/utils'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const canUpdate = hasAccessByCodes(['ai:skill:update']) // 是否有修改权限
const file = ref<SkillFile>() // 文件信息
const content = ref('') // 文件内容
const tabIndex = ref(0) // 当前标签：0 - 编辑；1 - 预览
const saving = ref(false) // 保存状态

const isMarkdown = computed(() => file.value?.fileType === 'md') // 是否为 Markdown 文件

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/skill/index')
}

/** 加载文件 */
async function getDetail() {
  if (!props.id) {
    return
  }
  try {
    toast.loading('加载中...')
    file.value = await getSkillFile(Number(props.id))
    content.value = file.value.content ?? ''
  } finally {
    toast.close()
  }
}

/** 保存文件内容 */
async function handleSave() {
  if (!file.value) {
    return
  }
  saving.value = true
  try {
    await updateSkillFileContent({ id: file.value.id, content: content.value })
    toast.success('保存成功')
    // 刷新文件列表中的大小，以及技能列表、详情中的描述（SKILL.md 头信息）
    uni.$emit('ai:skill-file:reload')
    uni.$emit('ai:skill:reload')
  } finally {
    saving.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
