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
        <wd-cell-group border>
          <wd-form-item title="会议室" title-width="200rpx" prop="roomId">
            <view class="flex items-center justify-end gap-12rpx" @click="openRoomPicker">
              <text class="text-28rpx" :class="selectedRoomName ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedRoomName || '请选择会议室' }}
              </text>
              <text v-if="selectedRoomLocation" class="shrink-0 text-24rpx text-[#999]">{{ selectedRoomLocation }}</text>
              <wd-icon name="arrow-right" size="26rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="会议主题" title-width="200rpx" prop="title">
            <wd-input
              v-model="formData.title"
              clearable
              :maxlength="200"
              placeholder="请输入会议主题"
            />
          </wd-form-item>
          <wd-form-item title="开始时间" title-width="200rpx" prop="startTime">
            <view class="flex items-center justify-end gap-12rpx" @click="startTimeVisible = true">
              <text class="text-28rpx" :class="startTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ startTime === '' ? '请选择开始时间' : formatDateTime(startTime) }}
              </text>
              <text v-if="startTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="startTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="结束时间" title-width="200rpx" prop="endTime">
            <view class="flex items-center justify-end gap-12rpx" @click="endTimeVisible = true">
              <text class="text-28rpx" :class="endTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ endTime === '' ? '请选择结束时间' : formatDateTime(endTime) }}
              </text>
              <text v-if="endTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="endTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <UserFormPicker v-model="formData.moderatorUserId" label="主持人" label-width="200rpx" prop="moderatorUserId" placeholder="请选择主持人" />
          <UserFormPicker v-model="formData.attendeeUserIds" label="参会人" label-width="200rpx" prop="attendeeUserIds" type="checkbox" placeholder="请选择参会人" />
          <yd-form-picker
            v-model="formData.reminderType"
            label="会议提醒"
            label-width="200rpx"
            prop="reminderType"
            :dict-type="DICT_TYPE.OA_MEETING_ROOM_REMINDER_TYPE"
            placeholder="请选择会议提醒"
          />
          <wd-form-item title="会议描述" title-width="200rpx" prop="description">
            <wd-textarea
              v-model="formData.description"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入会议描述"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入备注"
            />
          </wd-form-item>
          <wd-form-item title="附件" title-width="200rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/meeting-room-booking" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="startTime" v-model:visible="startTimeVisible" type="datetime" title="开始时间" />
      <wd-datetime-picker v-model="endTime" v-model:visible="endTimeVisible" type="datetime" title="结束时间" />
    </view>

    <!-- 会议室选择弹窗 -->
    <RoomPicker v-model="roomPickerVisible" :selected-id="formData.roomId" @select="handleRoomSelect" @schedule="handleRoomSchedule" />

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存草稿
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MeetingRoomBooking } from '@/api/oa/meetingroom/booking'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createMeetingRoomBooking, getMeetingRoomBooking, updateMeetingRoomBooking } from '@/api/oa/meetingroom/booking'
import RoomPicker from '@/pages-oa/meetingroom/room/components/room-picker.vue'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑会议室预定' : '新增会议室预定')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<MeetingRoomBooking>>({
  id: undefined,
  roomId: undefined,
  title: '',
  moderatorUserId: undefined,
  attendeeUserIds: [],
  reminderType: undefined,
  description: '',
  remark: '',
  fileUrls: [],
}) // 表单数据
const startTime = ref<number | ''>('') // 开始时间选择器值，空字符串承接未选择
const endTime = ref<number | ''>('') // 结束时间选择器值，空字符串承接未选择
const startTimeVisible = ref(false) // 开始时间选择器显示状态
const endTimeVisible = ref(false) // 结束时间选择器显示状态
const formSchema = createFormSchema({
  roomId: [{ required: true, message: '会议室不能为空' }],
  title: [{ required: true, message: '会议主题不能为空' }, { max: 200 }],
  moderatorUserId: [{ required: true, message: '主持人不能为空' }],
  attendeeUserIds: [{ required: true, message: '参会人不能为空' }],
  reminderType: [{ required: true, message: '会议提醒不能为空' }],
  description: [{ max: 500 }],
  remark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用
const roomPickerVisible = ref(false) // 会议室选择弹窗显示状态
const selectedRoomName = ref('') // 已选会议室名称回显
const selectedRoomLocation = ref('') // 已选会议室位置回显

/** 打开会议室选择弹窗 */
function openRoomPicker() {
  roomPickerVisible.value = true
}

/** 选择会议室 */
function handleRoomSelect(item: { id: number, name: string, location?: string }) {
  formData.value.roomId = item.id
  selectedRoomName.value = item.name
  selectedRoomLocation.value = item.location || ''
  roomPickerVisible.value = false
}

/** 查看会议室占用日程 */
function handleRoomSchedule(item: { id: number, name: string }) {
  uni.navigateTo({
    url: `/pages-oa/meetingroom/room/schedule/index?roomId=${item.id}&roomName=${encodeURIComponent(item.name)}`,
  })
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/meetingroom/booking/index')
}

/** 加载会议室预定详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getMeetingRoomBooking(Number(props.id))
  formData.value = data
  selectedRoomName.value = data.roomName || ''
  selectedRoomLocation.value = data.roomLocation || ''
  startTime.value = data.startTime ? toTimestamp(data.startTime) : ''
  endTime.value = data.endTime ? toTimestamp(data.endTime) : ''
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (startTime.value === '' || endTime.value === '') {
    toast.warning('请选择开始时间和结束时间')
    return
  }
  if (Number(startTime.value) >= Number(endTime.value)) {
    toast.warning('开始时间必须早于结束时间')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      startTime: startTime.value,
      endTime: endTime.value,
      attendeeUserIds: formData.value.attendeeUserIds ?? [],
      fileUrls: formData.value.fileUrls ?? [],
    } as unknown as MeetingRoomBooking
    if (props.id) {
      await updateMeetingRoomBooking(data)
      toast.success('修改成功')
    } else {
      await createMeetingRoomBooking(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:meeting-room-booking:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
