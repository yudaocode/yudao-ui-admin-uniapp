<template>
  <view class="pb-160rpx">
    <!-- 新建生成中：进度与实时正文，成功后进入剧本审阅，失败时回到表单并保留输入 -->
    <view v-if="creating" class="m-24rpx rounded-12rpx bg-white p-24rpx">
      <view class="mb-12rpx flex items-center gap-12rpx">
        <text class="text-30rpx text-[#333] font-semibold">正在生成剧本</text>
        <wd-loading size="32rpx" />
      </view>
      <view class="mb-12rpx text-24rpx text-[#999] leading-36rpx">
        已用时 {{ formatSeconds(createElapsed) }} · 已接收 {{ createContent.length }} 字
        <text v-if="createLastTime"> · 最近输出 {{ createIdle }} 秒前</text>
        · 完成后创建项目并打开剧本审阅
      </view>
      <view v-if="createIdle >= 30 || (!createLastTime && createElapsed >= 30)" class="mb-12rpx rounded-8rpx bg-[#f0f7ff] p-16rpx text-24rpx text-[#1677ff]">
        仍在等待模型输出
      </view>
      <view class="text-26rpx text-[#333] leading-44rpx">
        <view v-if="createTitle">
          <text class="font-semibold">剧名：</text>{{ createTitle }}
        </view>
        <view v-if="createTone">
          <text class="font-semibold">叙事基调：</text>{{ createTone }}
        </view>
        <view v-if="createOutline" class="whitespace-pre-wrap break-all">
          <text class="font-semibold">剧情大纲：</text>{{ createOutline }}
        </view>
        <view v-if="createContent" class="mt-16rpx border-t border-[#eee] border-t-solid pt-16rpx">
          <view class="mb-8rpx text-24rpx text-[#999]">
            剧本正文 · 实时追加
          </view>
          <view class="whitespace-pre-wrap break-all">
            {{ createContent }}
          </view>
        </view>
        <view v-if="!createTitle && !createContent" class="text-[#999]">
          正在生成剧名、叙事基调与大纲…
        </view>
      </view>
      <wd-button class="mt-24rpx" block variant="plain" @click="handleCancelCreate">
        取消生成
      </wd-button>
    </view>

    <!-- 表单区域 -->
    <template v-else>
      <view v-if="createError" class="m-24rpx rounded-12rpx bg-[#fff1f0] p-24rpx text-26rpx leading-40rpx" :class="createInterrupted ? 'text-[#fa8c16]' : 'text-[#f5222d]'">
        <view class="font-semibold">
          {{ createStopped ? '已停止接收' : createInterrupted ? '连接已中断' : `生成失败：${createError}` }}
        </view>
        <view class="mt-8rpx text-24rpx">
          {{ createInterrupted ? createError : '没有创建项目，已保留填写的内容，可修改后重新生成' }}
        </view>
      </view>

      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="项目名称" title-width="180rpx" prop="name">
            <wd-input
              v-model="formData.name"
              :maxlength="64"
              clearable
              :placeholder="detail ? '请输入项目名称' : '生成时选填，留空使用生成的剧名'"
            />
          </wd-form-item>
          <wd-form-item title="故事想法" title-width="180rpx" prop="idea" layout="vertical">
            <wd-textarea
              v-model="formData.idea"
              :maxlength="5000"
              show-word-limit
              clearable
              auto-height
              placeholder="一句话或一段话描述故事：人物、冲突、结局"
            />
          </wd-form-item>
        </wd-cell-group>

        <!-- 高级设置：默认折叠 -->
        <wd-collapse v-model="advancedActive" class="mt-16rpx">
          <wd-collapse-item name="advanced">
            <template #title>
              <view class="min-w-0">
                <text class="text-28rpx text-[#333] font-semibold">高级设置</text>
                <view class="truncate text-22rpx text-[#999]">
                  {{ advancedSummary }}
                </view>
              </view>
            </template>
            <wd-cell-group border>
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
              <wd-form-item title="项目简介" title-width="180rpx">
                <wd-input v-model="formData.description" :maxlength="500" clearable placeholder="请输入项目简介" />
              </wd-form-item>
              <yd-form-picker
                v-model="formData.style"
                label="画风"
                label-width="180rpx"
                :dict-type="DICT_TYPE.AI_DRAMA_STYLE"
              />
              <wd-form-item title="画幅" title-width="180rpx" center>
                <wd-radio-group v-model="formData.composeAspectRatio" type="button">
                  <wd-radio v-for="item in AI_DRAMA_ASPECT_RATIOS" :key="item" :value="item">
                    {{ item }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <yd-form-picker
                v-model="formData.aestheticSkillId"
                label="美学技能"
                label-width="180rpx"
                placeholder="不使用"
                :columns="skillList"
                label-key="name"
                value-key="id"
                clearable
              />
              <yd-form-picker
                v-model="formData.directorSkillId"
                label="导演技能"
                label-width="180rpx"
                placeholder="不使用"
                :columns="skillList"
                label-key="name"
                value-key="id"
                clearable
              />
              <yd-form-picker
                v-model="formData.storyboardSkillIds"
                label="分镜技能"
                label-width="180rpx"
                placeholder="不使用"
                :columns="skillList"
                label-key="name"
                value-key="id"
                type="checkbox"
                clearable
              />
            </wd-cell-group>
          </wd-collapse-item>
        </wd-collapse>
      </wd-form>
    </template>

    <!-- 底部操作按钮：保存、生成互斥，新建时两者都会创建项目，避免重复创建 -->
    <view v-if="!creating" class="yd-detail-footer">
      <view class="w-full flex items-center gap-16rpx">
        <wd-button
          class="flex-1"
          variant="plain"
          block
          :loading="saving"
          :disabled="generating"
          @click="handleSave"
        >
          保存想法
        </wd-button>
        <wd-button
          class="flex-1"
          type="primary"
          block
          :loading="generating"
          :disabled="saving"
          @click="handleGenerate"
        >
          {{ generateText }}
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DramaProjectDetail } from '@/api/ai/drama/project'
import type { DramaScriptCreateReq } from '@/api/ai/drama/script'
import type { AiModel } from '@/api/ai/model/model'
import type { Skill } from '@/api/ai/skill'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { createDramaProject, updateDramaProjectMy } from '@/api/ai/drama/project'
import { createDramaProjectStream, generateDramaScript } from '@/api/ai/drama/script'
import { getModelSimpleList } from '@/api/ai/model/model'
import { getSimpleSkillList } from '@/api/ai/skill'
import { getDictLabel } from '@/hooks/useDict'
import { createSseController } from '@/http/sse'
import { AI_DRAMA_ASPECT_RATIOS, AiDramaStepEnum, AiDramaStyleEnum, AiModelTypeEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  detail?: DramaProjectDetail // 项目详情：新建时为空
}>()

const emit = defineEmits<{
  refresh: []
  next: [step: number]
  created: [id: number]
}>()

const INTERRUPTED_ERROR = '连接已中断，生成可能仍在后台完成，请稍后在项目列表中查看，确认没有新项目后再重试' // 流式连接中断的提示
const CANCELED_ERROR = '已停止接收，服务端可能仍会完成，请稍后在项目列表查看' // 手动取消的提示

const toast = useToast()
const dialog = useDialog()
const formRef = ref<FormInstance>() // 表单组件引用
const project = props.detail?.project // 当前项目：新建时为空
const formData = ref({ // 表单数据
  name: project?.name || '',
  description: project?.description,
  idea: project?.idea,
  style: project?.style ?? AiDramaStyleEnum.SCRIPT_TONE,
  aestheticSkillId: project?.aestheticSkillId,
  directorSkillId: project?.directorSkillId,
  storyboardSkillIds: project?.storyboardSkillIds || [],
  composeAspectRatio: project?.composeAspectRatio || '9:16',
})
const formSchema = createFormSchema({
  name: [{ required: () => !!project, message: '项目名称不能为空' }], // 新建时生成草稿剧本可为空，保存想法时在提交前校验
  idea: [{ required: true, message: '故事想法不能为空' }],
})
const skillList = ref<Skill[]>([]) // 启用的技能
const chatModelList = ref<AiModel[]>([]) // 对话模型
const chatModelId = ref<number>() // 选择的对话模型
const advancedActive = ref<string[]>([]) // 高级设置展开状态
const saving = ref(false) // 保存想法状态
const generating = ref(false) // 已有项目生成剧本状态

const advancedSummary = computed(() => { // 高级设置收起时展示当前取值
  const model = chatModelList.value.find(item => item.id === chatModelId.value)
  const style = getDictLabel(DICT_TYPE.AI_DRAMA_STYLE, formData.value.style)
  const skillCount = (formData.value.aestheticSkillId ? 1 : 0)
    + (formData.value.directorSkillId ? 1 : 0)
    + (formData.value.storyboardSkillIds?.length || 0)
  return [
    model?.name || '默认对话模型',
    style,
    formData.value.composeAspectRatio,
    skillCount ? `技能：${skillCount} 个` : '技能：不使用',
  ].filter(Boolean).join(' · ')
})
const generateText = computed(() => { // 生成按钮文案
  if (!project) {
    return '生成草稿剧本'
  }
  return props.detail?.script?.content ? '重新生成剧本' : '生成剧本'
})

// ========== 新建：流式生成草稿剧本 ==========

const creating = ref(false) // 是否正在流式生成
const createText = ref('') // 已接收的 JSON 原文
const createError = ref('') // 生成失败原因
const createInterrupted = ref(false) // 是否为连接中断：服务端可能仍在完成
const createStopped = ref(false) // 是否为用户主动取消：只停止接收，服务端可能仍在完成
const createStartTime = ref(0) // 生成开始时间
const createLastTime = ref(0) // 最近一次收到输出的时间
const now = ref(Date.now()) // 当前时间：驱动已用时展示
const createContent = computed(() => readJsonField(createText.value, 'content') || '') // 已生成的剧本正文
const createTitle = computed(() => readJsonField(createText.value, 'title')) // 已生成的剧名
const createTone = computed(() => readJsonField(createText.value, 'tone')) // 已生成的叙事基调
const createOutline = computed(() => readJsonField(createText.value, 'outline')) // 已生成的剧情大纲
const createElapsed = computed(() => Math.max(0, Math.floor((now.value - createStartTime.value) / 1000))) // 已用时（秒）
const createIdle = computed(() => createLastTime.value ? Math.max(0, Math.floor((now.value - createLastTime.value) / 1000)) : 0) // 距离最近输出的时间（秒）
let createCtrl: AbortController | undefined // 流式请求控制器
let clock: ReturnType<typeof setInterval> | undefined // 已用时计时器
let unmounted = false // 页面是否已卸载

/** 秒数显示为「1 分 12 秒」 */
function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes} 分 ${seconds % 60} 秒` : `${seconds} 秒`
}

/** 从生成中的 JSON 原文读取字符串字段：字符串未结束时，返回已接收的部分 */
function readJsonField(raw: string, key: string): string | undefined {
  const match = new RegExp(`"${key}"\\s*:\\s*"`).exec(raw)
  if (!match) {
    return undefined
  }
  const escapes: Record<string, string> = { n: '\n', t: '\t', r: '', b: '', f: '' }
  let result = ''
  for (let i = match.index + match[0].length; i < raw.length; i++) {
    const c = raw[i]
    if (c === '"') {
      return result
    }
    if (c !== '\\') {
      result += c
      continue
    }
    const next = raw[++i]
    if (next === undefined) {
      break
    }
    if (next === 'u') {
      const hex = raw.slice(i + 1, i + 5)
      if (hex.length < 4) {
        break
      }
      result += String.fromCharCode(Number.parseInt(hex, 16))
      i += 4
    } else {
      result += escapes[next] ?? next
    }
  }
  return result
}

/** 结束生成：停止计时和请求 */
function finishCreate() {
  creating.value = false
  if (clock) {
    clearInterval(clock)
    clock = undefined
  }
  createCtrl?.abort()
  createCtrl = undefined
}

/** 生成失败：保留输入，回到表单 */
function failCreate(error: string, interrupted = false) {
  if (!creating.value) {
    return
  }
  createError.value = error
  createInterrupted.value = interrupted
  finishCreate()
}

/** 取消生成：中断请求，只停止接收，不代表服务端已停止，也不判定为成功或失败 */
function handleCancelCreate() {
  createStopped.value = true
  failCreate(CANCELED_ERROR, true)
}

/** 处理流式消息：增量内容、业务错误、最后一条的项目编号 */
function handleStreamMessage(res: { data: string }) {
  if (!creating.value || !res.data) {
    return
  }
  let result: any
  try {
    result = JSON.parse(res.data)
  } catch {
    return // 不是 CommonResult 的数据行（例如心跳）：忽略
  }
  if (result.code !== 0) {
    failCreate(result.msg || '生成失败')
    return
  }
  if (result.data?.projectId) {
    const id = result.data.projectId as number
    finishCreate()
    toast.success('初版剧本已生成')
    emit('created', id)
    return
  }
  if (result.data?.content) {
    createText.value += result.data.content
    createLastTime.value = Date.now()
  }
}

/** 新建：流式生成草稿剧本，成功后才创建项目；项目名称选填 */
async function handleCreate() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  const data: DramaScriptCreateReq = {
    ...formData.value,
    name: formData.value.name.trim() || undefined,
    idea: formData.value.idea!,
    modelId: chatModelId.value,
  }
  createText.value = ''
  createError.value = ''
  createInterrupted.value = false
  createStopped.value = false
  createStartTime.value = Date.now()
  createLastTime.value = 0
  now.value = Date.now()
  creating.value = true
  clock = setInterval(() => (now.value = Date.now()), 1000)
  const ctrl = createSseController()
  createCtrl = ctrl
  createDramaProjectStream(
    data,
    ctrl,
    handleStreamMessage,
    () => {
      // 服务端业务错误在消息中处理；这里是网络、连接错误，请求可能已到达服务端
      if (!unmounted) {
        failCreate(INTERRUPTED_ERROR, true)
      }
    },
    () => {
      if (!unmounted && createCtrl === ctrl) {
        failCreate(INTERRUPTED_ERROR, true)
      }
    },
  ).catch(() => undefined) // 错误已在 onError 中处理，不自动重试，避免重复创建
}

// ========== 保存、生成 ==========

/** 保存：没有项目时新建，返回项目编号 */
async function save(): Promise<number | undefined> {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return undefined
  }
  if (!formData.value.name.trim()) {
    toast.warning('项目名称不能为空')
    return undefined
  }
  const data = { ...formData.value, name: formData.value.name.trim() }
  if (project) {
    await updateDramaProjectMy({ id: project.id, ...data })
    return project.id
  }
  return await createDramaProject(data)
}

/** 保存想法：只保存项目与想法，不调用模型；已有项目不改动剧本 */
async function handleSave() {
  saving.value = true
  try {
    const id = await save()
    if (!id) {
      return
    }
    if (project) {
      toast.success('保存成功')
      emit('refresh')
    } else {
      toast.success('创建成功')
      emit('created', id)
    }
  } finally {
    saving.value = false
  }
}

/** 生成剧本：新建走流式生成；已有项目先保存想法，再同步调用对话模型新增剧本版本，可能需要数十秒 */
async function handleGenerate() {
  if (!project) {
    await handleCreate()
    return
  }
  if (props.detail?.script?.content) {
    try {
      await dialog.confirm({ title: '提示', msg: '重新生成会新增剧本版本并作为当前剧本，是否继续？' })
    } catch {
      return
    }
  }
  generating.value = true
  try {
    const id = await save()
    if (!id) {
      return
    }
    await generateDramaScript(id, chatModelId.value)
    toast.success('剧本已生成')
    emit('next', AiDramaStepEnum.SCRIPT)
  } finally {
    generating.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  const [skills, models] = await Promise.all([
    getSimpleSkillList(),
    getModelSimpleList(AiModelTypeEnum.CHAT),
  ])
  skillList.value = skills.filter(item => item.id)
  chatModelList.value = models
})

/** 卸载：中断未完成的流式请求 */
onBeforeUnmount(() => {
  unmounted = true
  finishCreate()
})
</script>
