<template>
  <scroll-view class="min-h-0 flex-1" scroll-y>
    <view class="p-24rpx">
      <view
        v-for="item in requests"
        :key="item.id"
        class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
      >
        <view class="flex items-start gap-20rpx">
          <ImAvatar :src="item.userAvatar" :name="item.userNickname || String(item.userId)" />
          <view class="min-w-0 flex-1">
            <view class="flex items-center justify-between gap-12rpx">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.userNickname || `用户 ${item.userId}` }}
              </view>
              <dict-tag :type="DICT_TYPE.IM_GROUP_REQUEST_HANDLE_RESULT" :value="item.handleResult" />
            </view>
            <view class="mt-8rpx text-26rpx text-[#666]">
              <template v-if="item.inviterUserId">
                通过 <text class="text-[#4d80f0]">{{ item.inviterNickname || `用户 ${item.inviterUserId}` }}</text> 邀请加入：
              </template>
              <template v-else>
                申请加入：
              </template>
              {{ item.groupName || `群 ${item.groupId}` }}
            </view>
            <view class="mt-8rpx text-26rpx text-[#666]">
              {{ item.applyContent || '暂无申请理由' }}
            </view>
            <view v-if="item.handleContent" class="mt-8rpx text-24rpx text-[#999]">
              拒绝理由：{{ item.handleContent }}
            </view>
            <view class="mt-8rpx text-24rpx text-[#999]">
              {{ formatDateTime(item.createTime) }}
            </view>
            <view v-if="item.handleResult === ImGroupRequestHandleResult.UNHANDLED" class="mt-20rpx flex gap-16rpx">
              <wd-button
                class="flex-1"
                size="small"
                type="primary"
                :loading="actingId === item.id && actingAction === 'agree'"
                :disabled="actingId != null"
                @click="handleAgree(item)"
              >
                同意
              </wd-button>
              <wd-button
                class="flex-1"
                size="small"
                type="danger"
                variant="plain"
                :loading="actingId === item.id && actingAction === 'refuse'"
                :disabled="actingId != null"
                @click="handleRefuse(item)"
              >
                拒绝
              </wd-button>
            </view>
          </view>
        </view>
      </view>
      <wd-empty
        v-if="!loading && requests.length === 0"
        icon="content"
        :tip="groupId ? '暂无进群申请记录' : '暂无待处理加群申请'"
      />
    </view>
  </scroll-view>
</template>

<script lang="ts" setup>
import type { ImGroupRequestRespVO } from '@/api/im/group/request'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getGroupRequestListByGroupId } from '@/api/im/group/request'
import { DICT_TYPE, ImGroupRequestHandleResult } from '@/pages-im/utils/constants'
import { formatDateTime } from '@/utils/date'
import { useGroupRequestStore } from '../../../store/groupRequestStore'
import ImAvatar from '../../../components/im-avatar.vue'

const props = defineProps<{
  groupId: number // 指定群聊编号，为 0 时展示全局待处理申请
}>()

const groupRequestStore = useGroupRequestStore()
const dialog = useDialog()
const toast = useToast()
const singleGroupRequests = ref<ImGroupRequestRespVO[]>([]) // 指定群聊的全部申请记录
const singleGroupLoading = ref(false) // 指定群聊申请加载状态
const actingId = ref<number>() // 当前处理的申请编号
const actingAction = ref<'agree' | 'refuse'>() // 当前申请操作
const { unhandledList, loading: globalLoading } = storeToRefs(groupRequestStore)
const requests = computed(() => props.groupId ? singleGroupRequests.value : unhandledList.value) // 当前申请列表
const loading = computed(() => props.groupId ? singleGroupLoading.value : globalLoading.value) // 当前加载状态
const singleGroupChangeKey = computed(() => props.groupId
  ? unhandledList.value
      .filter(request => request.groupId === props.groupId)
      .map(request => `${request.id}:${request.inviterUserId ?? ''}:${request.applyContent ?? ''}`)
      .join(',')
  : '') // 指定群聊的实时申请变更标识
let singleGroupLoadSeq = 0 // 指定群聊申请加载序号

/** 同意加群申请 */
async function handleAgree(item: ImGroupRequestRespVO) {
  if (actingId.value != null || item.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'agree'
  try {
    if (!await groupRequestStore.agreeGroupRequest(item.id)) {
      return
    }
    markHandled(item.id, ImGroupRequestHandleResult.AGREED)
    toast.success('已同意')
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 拒绝加群申请 */
async function handleRefuse(item: ImGroupRequestRespVO) {
  if (actingId.value != null || item.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
    return
  }
  let handleContent: string | undefined
  try {
    const result = await dialog.prompt({
      title: '拒绝加群申请',
      msg: '可填写拒绝理由（选填）',
      inputProps: { maxlength: 255, placeholder: '不填则不告知对方原因' },
    })
    handleContent = String(result.value || '').trim() || undefined
  } catch {
    return
  }
  if (actingId.value != null || item.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
    return
  }
  actingId.value = item.id
  actingAction.value = 'refuse'
  try {
    if (!await groupRequestStore.refuseGroupRequest(item.id, handleContent)) {
      return
    }
    markHandled(item.id, ImGroupRequestHandleResult.REFUSED, handleContent)
    toast.success('已拒绝')
  } finally {
    actingId.value = undefined
    actingAction.value = undefined
  }
}

/** 更新指定群聊中的申请处理结果 */
function markHandled(id: number, handleResult: number, handleContent?: string) {
  if (!props.groupId) {
    return
  }
  const request = singleGroupRequests.value.find(item => item.id === id)
  if (!request) {
    return
  }
  request.handleResult = handleResult
  request.handleTime = new Date().toISOString()
  if (handleContent !== undefined) {
    request.handleContent = handleContent
  }
}

/** 加载加群申请 */
async function load() {
  if (!props.groupId) {
    await groupRequestStore.fetchUnhandledGroupRequestList()
    return
  }
  const targetGroupId = props.groupId
  const loadSeq = ++singleGroupLoadSeq
  singleGroupLoading.value = true
  try {
    const list = await getGroupRequestListByGroupId(targetGroupId)
    if (loadSeq === singleGroupLoadSeq && props.groupId === targetGroupId) {
      singleGroupRequests.value = list
    }
  } finally {
    if (loadSeq === singleGroupLoadSeq) {
      singleGroupLoading.value = false
    }
  }
}

/** 指定群聊收到或处理申请后重新拉取完整历史 */
watch(singleGroupChangeKey, (current, previous) => {
  if (!props.groupId || current === previous) {
    return
  }
  void load()
})

defineExpose({ load })
</script>
