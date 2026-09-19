<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <view class="min-h-0 flex-1 overflow-auto p-24rpx">
      <!-- 表单区域 -->
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-input
            v-model="formData.name"
            label="会议室名称"
            label-width="220rpx"
            prop="name"
            placeholder="请输入名称"
            :maxlength="100"
            clearable
          />
          <yd-form-picker
            v-model="formData.type"
            label="会议室类型"
            label-width="220rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_MEETING_ROOM_TYPE"
            placeholder="请选择类型"
          />
          <wd-input
            v-model="formData.location"
            label="会议室位置"
            label-width="220rpx"
            prop="location"
            placeholder="请输入位置"
            :maxlength="255"
            clearable
          />
          <UserFormPicker
            v-model="formData.managerUserId"
            label="负责人"
            label-width="220rpx"
            prop="managerUserId"
            placeholder="请选择负责人"
            @confirm="handleManagerChange"
          />
          <wd-input
            v-model="formData.managerPhone"
            label="联系方式"
            label-width="220rpx"
            placeholder="选择负责人后显示"
            disabled
          />
          <wd-cell title="可用状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" inline>
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <wd-form-item title="会议室图片" title-width="220rpx">
            <yd-upload-img v-model="formData.picUrl" directory="oa/meeting-room" />
          </wd-form-item>
          <wd-cell title="坐席数" title-width="220rpx">
            <wd-input-number v-model="formData.seatCount" :min="1" :precision="0" allow-null />
          </wd-cell>
          <yd-form-picker
            v-model="formData.equipments"
            label="会议室设备"
            label-width="220rpx"
            type="checkbox"
            :dict-type="DICT_TYPE.OA_MEETING_ROOM_EQUIPMENT"
            placeholder="请选择设备"
          />
          <wd-cell title="允许预定" title-width="220rpx">
            <wd-switch v-model="formData.allowBooking" />
          </wd-cell>
          <wd-cell title="预定需审批" title-width="220rpx">
            <wd-switch v-model="formData.needApproval" />
          </wd-cell>
          <wd-cell title="可预定范围" title-width="220rpx" prop="bookingScope">
            <wd-radio-group v-model="formData.bookingScope" inline>
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.OA_MEETING_ROOM_BOOKING_SCOPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-cell>
          <UserFormPicker
            v-if="formData.bookingScope === OA_MEETING_ROOM_BOOKING_SCOPE.SPECIFIED"
            v-model="formData.bookingUserIds"
            type="checkbox"
            label="指定成员"
            label-width="220rpx"
            prop="bookingUserIds"
            placeholder="请选择可预定成员"
          />
          <wd-cell title="显示顺序" title-width="220rpx" prop="sort">
            <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
          </wd-cell>
          <wd-form-item title="附件" title-width="220rpx">
            <yd-upload-file v-model="formData.fileUrls" :limit="10" directory="oa/meeting-room" />
          </wd-form-item>
          <wd-textarea
            v-model="formData.remark"
            label="备注"
            label-width="220rpx"
            placeholder="请输入备注"
            :maxlength="200"
            clearable
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MeetingRoom } from '@/api/oa/meetingroom/room'
import type { User } from '@/api/system/user'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createMeetingRoom, getMeetingRoom, updateMeetingRoom } from '@/api/oa/meetingroom/room'
import UserFormPicker from '@/components/system-select/user-form-picker.vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import { OA_MEETING_ROOM_BOOKING_SCOPE, OA_MEETING_ROOM_STATUS } from '../../../utils/constants'

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
const getTitle = computed(() => props.id ? '修改会议室' : '新增会议室')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<MeetingRoom>>(createDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '名称不能为空' }, { max: 100 }],
  type: [{ required: true, message: '类型不能为空' }],
  location: [{ required: true, message: '位置不能为空' }],
  managerUserId: [{ required: true, message: '负责人不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  bookingScope: [{ required: true, message: '预定范围不能为空' }],
  bookingUserIds: [{ required: () => formData.value.bookingScope === OA_MEETING_ROOM_BOOKING_SCOPE.SPECIFIED, message: '请选择可预定成员' }],
  sort: [{ required: true, message: '排序不能为空' }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/meetingroom/room/index')
}

/** 创建会议室默认表单数据 */
function createDefaultFormData(): Partial<MeetingRoom> {
  return {
    status: OA_MEETING_ROOM_STATUS.NORMAL,
    allowBooking: true,
    needApproval: false,
    bookingScope: OA_MEETING_ROOM_BOOKING_SCOPE.ALL,
    bookingUserIds: [],
    equipments: [],
    sort: 0,
    fileUrls: [],
  }
}

/** 选择负责人，回显联系方式 */
function handleManagerChange(users: User[]) {
  formData.value.managerPhone = users[0]?.mobile
}

/** 加载会议室详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getMeetingRoom(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    if (props.id) {
      await updateMeetingRoom(formData.value)
    } else {
      await createMeetingRoom(formData.value)
    }
    toast.success('保存成功')
    uni.$emit('oa:meeting-room:reload')
    navigateBackPlus('/pages-oa/meetingroom/room/index')
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
