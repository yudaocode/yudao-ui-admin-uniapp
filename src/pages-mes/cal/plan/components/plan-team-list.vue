<template>
  <view class="mt-24rpx bg-white">
    <!-- 班组标题 -->
    <view v-if="showTitle" class="flex items-center justify-between px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        班组
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openForm">
        添加班组
      </wd-button>
    </view>

    <!-- 班组列表 -->
    <view class="px-24rpx pb-8rpx">
      <wd-loading v-if="loading" />
      <view v-else-if="list.length === 0" class="py-48rpx text-center text-26rpx text-[#999]">
        暂无计划班组
      </view>
      <template v-else>
        <view v-for="item in list" :key="item.id" class="mb-20rpx rounded-12rpx bg-[#f8fafc] p-20rpx">
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1" @click="handlePreviewMembers(item)">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.teamName || `班组 #${item.teamId}` }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ item.teamCode || '-' }}
              </view>
            </view>
            <wd-button v-if="editable && item.id" size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
          <view class="text-26rpx text-[#666]">
            备注：{{ item.remark || '-' }}
          </view>
        </view>
      </template>
    </view>

    <!-- 成员预览 -->
    <view v-if="selectedTeamId" class="mx-24rpx mb-24rpx rounded-12rpx bg-[#fff7ed] p-20rpx">
      <view class="mb-16rpx text-28rpx text-[#333] font-semibold">
        {{ selectedTeamName }} 成员
      </view>
      <wd-loading v-if="memberLoading" />
      <view v-else-if="memberList.length === 0" class="py-24rpx text-center text-24rpx text-[#999]">
        暂无成员
      </view>
      <view v-for="member in memberList" v-else :key="member.id || member.userId" class="mb-12rpx rounded-8rpx bg-white p-16rpx text-24rpx text-[#666]">
        <view class="text-26rpx text-[#333]">
          {{ member.nickname || `用户 #${member.userId}` }}
        </view>
        <view class="mt-4rpx">
          手机号：{{ member.telephone || '-' }}
        </view>
      </view>
    </view>

    <!-- 添加班组弹层 -->
    <wd-popup v-model="formVisible" position="bottom" :safe-area-inset-bottom="true">
      <view class="max-h-[86vh] flex flex-col bg-white">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">
            添加班组
          </text>
          <wd-icon name="close" size="36rpx" @click="formVisible = false" />
        </view>
        <view class="p-24rpx">
          <wd-search v-model="teamKeyword" placeholder="搜索班组编码/名称" hide-cancel @search="loadTeamOptions" @clear="loadTeamOptions" />
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <view class="px-24rpx pb-24rpx">
            <wd-loading v-if="teamLoading" />
            <view v-else-if="teamOptions.length === 0" class="py-48rpx text-center text-26rpx text-[#999]">
              暂无可选班组
            </view>
            <template v-else>
              <view
                v-for="team in teamOptions"
                :key="team.id"
                class="mb-16rpx border border-[#edf0f5] rounded-12rpx p-20rpx"
                :class="selectedTeamIds.includes(Number(team.id)) ? 'border-[#1677ff] bg-[#eef6ff]' : 'bg-white'"
                @click="toggleTeam(team)"
              >
                <view class="text-30rpx text-[#333] font-semibold">
                  {{ team.name }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ team.code }}
                </view>
              </view>
            </template>
          </view>
        </scroll-view>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="formLoading" @click="handleCreateTeams">
            添加选中班组
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { CalTeamMember } from '@/api/mes/cal/team/member'
import type { CalTeam } from '@/api/mes/cal/team'
import type { CalPlanTeam } from '@/api/mes/cal/plan/team'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { createPlanTeam, deletePlanTeam, getPlanTeamListByPlan } from '@/api/mes/cal/plan/team'
import { getTeamPage } from '@/api/mes/cal/team'
import { getTeamMemberListByTeam } from '@/api/mes/cal/team/member'

const props = withDefaults(defineProps<{
  planId?: number
  editable?: boolean
  showTitle?: boolean
}>(), {
  planId: undefined,
  editable: false,
  showTitle: true,
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 计划班组加载状态
const list = ref<CalPlanTeam[]>([]) // 计划班组列表
const selectedTeamId = ref<number>() // 当前预览班组
const selectedTeamName = ref('') // 当前预览班组名称
const memberLoading = ref(false) // 成员加载状态
const memberList = ref<CalTeamMember[]>([]) // 成员列表
const formVisible = ref(false) // 表单弹层显示状态
const formLoading = ref(false) // 表单提交状态
const teamLoading = ref(false) // 班组选项加载状态
const teamKeyword = ref('') // 班组搜索关键字
const teamOptions = ref<CalTeam[]>([]) // 可选班组
const selectedTeamIds = ref<number[]>([]) // 已选班组编号

/** 查询计划班组 */
async function getList() {
  if (!props.planId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getPlanTeamListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

/** 打开添加班组表单 */
async function openForm() {
  if (!props.planId) {
    toast.warning('请先保存排班计划后再添加班组')
    return
  }
  selectedTeamIds.value = []
  teamKeyword.value = ''
  formVisible.value = true
  await loadTeamOptions()
}

/** 查询班组选项 */
async function loadTeamOptions() {
  teamLoading.value = true
  try {
    const data = await getTeamPage({
      pageNo: 1,
      pageSize: 50,
      code: teamKeyword.value || undefined,
      name: teamKeyword.value || undefined,
    })
    const existing = new Set(list.value.map(item => item.teamId))
    teamOptions.value = data.list.filter(team => team.id && !existing.has(team.id))
  } finally {
    teamLoading.value = false
  }
}

/** 选择或取消班组 */
function toggleTeam(team: CalTeam) {
  if (!team.id) {
    return
  }
  const id = team.id
  if (selectedTeamIds.value.includes(id)) {
    selectedTeamIds.value = selectedTeamIds.value.filter(item => item !== id)
  } else {
    selectedTeamIds.value = [...selectedTeamIds.value, id]
  }
}

/** 添加选中班组 */
async function handleCreateTeams() {
  if (!props.planId || selectedTeamIds.value.length === 0) {
    toast.warning('请至少选择一个班组')
    return
  }
  formLoading.value = true
  try {
    for (const teamId of selectedTeamIds.value) {
      await createPlanTeam({ planId: props.planId, teamId })
    }
    toast.success(`成功添加 ${selectedTeamIds.value.length} 个班组`)
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除计划班组 */
async function handleDelete(item: CalPlanTeam) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({
      title: '删除确认',
      msg: `确定要移除「${item.teamName || item.teamId}」班组吗？`,
    })
  } catch {
    return
  }
  await deletePlanTeam(item.id)
  toast.success('删除成功')
  if (selectedTeamId.value === item.teamId) {
    selectedTeamId.value = undefined
    selectedTeamName.value = ''
    memberList.value = []
  }
  await getList()
}

/** 预览班组成员 */
async function handlePreviewMembers(item: CalPlanTeam) {
  selectedTeamId.value = item.teamId
  selectedTeamName.value = item.teamName || `班组 #${item.teamId}`
  memberLoading.value = true
  try {
    memberList.value = await getTeamMemberListByTeam(item.teamId)
  } finally {
    memberLoading.value = false
  }
}

/** 监听计划编号变化 */
watch(
  () => props.planId,
  () => getList(),
  { immediate: true },
)

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:cal:plan:reload', getList)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:cal:plan:reload', getList)
})
</script>
