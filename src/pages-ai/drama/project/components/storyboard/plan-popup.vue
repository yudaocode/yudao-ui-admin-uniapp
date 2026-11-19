<template>
  <!-- 规划分镜弹窗：规划结果不保存，可多次规划对比，确认后导入替换当前剧本的分镜 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    safe-area-inset-bottom
    custom-style="max-height: 90vh; border-radius: 32rpx 32rpx 0 0; background-color: #f5f5f5;"
  >
    <view class="pb-24rpx pt-24rpx">
      <view class="mb-12rpx flex items-center justify-between px-24rpx">
        <text class="text-32rpx text-[#222] font-semibold">规划分镜</text>
        <wd-icon name="close" size="36rpx" color="#999" @click="visible = false" />
      </view>

      <!-- 方案切换 -->
      <view class="flex flex-wrap items-center gap-12rpx px-24rpx pb-12rpx">
        <wd-tag
          v-for="(item, index) in candidates"
          :key="index"
          :type="index === candidateIndex ? 'primary' : 'default'"
          @click="candidateIndex = index"
        >
          方案 {{ index + 1 }}（{{ item.length }} 镜）
        </wd-tag>
        <wd-button size="small" variant="plain" :loading="planning" @click="handlePlan">
          {{ candidates.length ? '再规划一版' : '开始规划' }}
        </wd-button>
      </view>
      <view class="px-24rpx pb-12rpx text-22rpx text-[#999]">
        规划结果只保存在当前窗口，关闭后丢失；多场剧本需要较长时间，请耐心等待
      </view>

      <view v-if="!current.length" class="py-80rpx text-center text-26rpx text-[#999]">
        <wd-loading v-if="planning" />
        <text v-else>尚未规划</text>
      </view>
      <scroll-view v-else scroll-y class="max-h-[60vh]">
        <view class="px-24rpx">
          <!-- 合计 -->
          <view class="mb-12rpx text-24rpx text-[#666]">
            合计 {{ totalDuration }} 秒；当前已有 {{ detail.storyboards.length }} 个镜头
          </view>
          <!-- 规划提示：导入前请检查 -->
          <view v-if="planWarnings.length" class="mb-12rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-24rpx text-[#d46b08]">
            <view class="mb-8rpx font-semibold">
              有 {{ planWarnings.length }} 处需要检查
            </view>
            <view v-for="(item, index) in planWarnings" :key="index" class="break-all">
              {{ item }}
            </view>
          </view>

          <!-- 按原文场次分组的镜头 -->
          <view v-for="group in groups" :key="group.sceneNumber" class="mb-16rpx">
            <view class="mb-8rpx text-26rpx text-[#333] font-semibold">
              场次 {{ group.sceneNumber }} · {{ group.items.length }} 镜 · {{ group.duration }} 秒
            </view>
            <view v-for="item in group.items" :key="item.sceneNo" class="mb-12rpx rounded-12rpx bg-white p-20rpx">
              <view class="flex items-center gap-12rpx">
                <text class="shrink-0 text-26rpx text-[#999]">镜 {{ item.sceneNo }}</text>
                <wd-input v-model="item.title" class="min-w-0 flex-1" placeholder="镜头标题" :maxlength="255" no-border />
                <wd-button size="small" type="danger" variant="plain" @click="handleRemove(item)">
                  移除
                </wd-button>
              </view>
              <view class="mt-8rpx whitespace-pre-wrap break-all text-24rpx text-[#666]">
                {{ item.sceneText || '-' }}
              </view>
              <view v-for="(dialogue, index) in item.dialogues || []" :key="index" class="mt-6rpx break-all text-22rpx text-[#999]">
                {{ getCharacterName(dialogue.characterId) }}：{{ dialogue.line }}
              </view>
              <view class="mt-12rpx flex items-center gap-12rpx">
                <text class="text-24rpx text-[#666]">时长（秒）</text>
                <wd-input-number v-model="item.duration" :min="1" :max="60" />
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="flex gap-24rpx px-24rpx pt-16rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button class="flex-1" type="primary" :loading="importing" :disabled="!current.length || planning" @click="handleImport">
          导入此方案
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { DramaStoryboard } from '@/api/ai/drama/storyboard'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { importDramaStoryboardList, planDramaStoryboardList } from '@/api/ai/drama/script'

const props = defineProps<{
  detail: DramaProjectDetail // 项目详情
  chatModelId?: number // 对话模型；为空使用默认
}>()

const emit = defineEmits<{
  imported: [] // 已导入分镜
}>()

const visible = defineModel<boolean>({ default: false }) // 弹窗显示状态；打开时立即开始规划
const toast = useToast()
const dialog = useDialog()
const planning = ref(false) // 规划中
const importing = ref(false) // 导入中
const candidates = ref<DramaStoryboard[][]>([]) // 规划出的方案
const candidateIndex = ref(0) // 当前方案
const scriptId = ref<number>() // 发起规划时的剧本编号：规划与导入都以它为准
let openToken = 0 // 本次打开的标识：关闭、重新打开后，迟到的规划结果丢弃

const current = computed(() => candidates.value[candidateIndex.value] || []) // 当前方案的镜头
const totalDuration = computed(() => current.value.reduce((sum, item) => sum + (item.duration || 0), 0)) // 当前方案的总时长
const planWarnings = computed(() => // 规划提示：带上第几个镜头
  current.value.flatMap((item, index) => (item.planWarnings || []).map(warning => `第 ${index + 1} 镜「${item.title || ''}」：${warning}`)),
)
const groups = computed(() => { // 按原文场次分组：取规划返回的场次，没有时按镜头序号
  const map = new Map<number, { sceneNumber: number, items: DramaStoryboard[], duration: number }>()
  current.value.forEach((item) => {
    const sceneNumber = item.continuity?.sceneNumber ?? item.sceneNo ?? 0
    const group = map.get(sceneNumber) || { sceneNumber, items: [], duration: 0 }
    group.items.push(item)
    group.duration += item.duration || 0
    map.set(sceneNumber, group)
  })
  return Array.from(map.values()).sort((a, b) => a.sceneNumber - b.sceneNumber)
})

/** 获得发言人名称：旁白没有角色 */
function getCharacterName(characterId?: number) {
  return props.detail.characters.find(item => item.id === characterId)?.name || '旁白'
}

/** 规划：多场剧本按场逐场规划（后端），只返回不保存；导入确认前原分镜保留 */
async function handlePlan() {
  if (planning.value) {
    return
  }
  const token = openToken
  const planScriptId = scriptId.value
  planning.value = true
  try {
    const list = await planDramaStoryboardList(props.detail.project.id, props.chatModelId)
    // 已关闭窗口：丢弃，不保存
    if (token !== openToken) {
      return
    }
    // 规划期间剧本有了新版本：返回的分镜不属于发起时的剧本，丢弃
    if (list.some(item => item.scriptId && item.scriptId !== planScriptId)) {
      toast.warning('剧本已有新版本，请关闭后重新规划分镜')
      return
    }
    candidates.value.push(list)
    candidateIndex.value = candidates.value.length - 1
  } finally {
    if (token === openToken) {
      planning.value = false
    }
  }
}

/** 移除镜头 */
function handleRemove(item: DramaStoryboard) {
  const index = current.value.indexOf(item)
  if (index >= 0) {
    current.value.splice(index, 1)
  }
}

/** 导入此方案：替换当前剧本的全部分镜 */
async function handleImport() {
  const token = openToken
  const storyboards = current.value
  try {
    await dialog.confirm({
      title: '提示',
      msg: `导入后替换当前剧本的全部 ${props.detail.storyboards.length} 个镜头（包括已生成的关键帧、视频），是否继续？`,
    })
  } catch {
    return
  }
  if (token !== openToken || storyboards !== current.value) {
    toast.warning('规划窗口已变化，请重新确认导入')
    return
  }
  // 剧本已有新版本：拒绝导入，后端同样校验
  if (!scriptId.value || props.detail.script?.id !== scriptId.value) {
    toast.warning('剧本已有新版本，请关闭后重新规划分镜')
    return
  }
  importing.value = true
  try {
    await importDramaStoryboardList({ projectId: props.detail.project.id, scriptId: scriptId.value, storyboards })
    toast.success('已导入分镜')
    visible.value = false
    emit('imported')
  } finally {
    importing.value = false
  }
}

/** 打开、关闭：打开时清空结果并立即规划；关闭时丢弃进行中的规划 */
watch(visible, (value) => {
  openToken++
  planning.value = false
  if (!value) {
    return
  }
  candidates.value = []
  candidateIndex.value = 0
  scriptId.value = props.detail.script?.id
  handlePlan()
})
</script>
