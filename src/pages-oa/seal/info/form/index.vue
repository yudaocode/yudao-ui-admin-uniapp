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
          <DeptFormPicker v-model="formData.deptId" label="所属部门" label-width="220rpx" prop="deptId" placeholder="请选择所属部门" />
          <wd-form-item title="印章名称" title-width="220rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              :maxlength="128"
              placeholder="请输入印章名称"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="印章类型"
            label-width="220rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_SEAL_TYPE"
            placeholder="请选择印章类型"
          />
          <yd-form-picker
            v-model="formData.category"
            label="印章分类"
            label-width="220rpx"
            prop="category"
            :dict-type="DICT_TYPE.OA_SEAL_CATEGORY"
            placeholder="请选择印章分类"
          />
          <UserFormPicker v-model="formData.keeperUserId" label="保管人" label-width="220rpx" prop="keeperUserId" placeholder="请选择保管人" />
          <DeptFormPicker v-model="formData.keeperDeptId" label="保管部门" label-width="220rpx" prop="keeperDeptId" placeholder="请选择保管部门" />
          <yd-form-picker
            v-model="formData.status"
            label="印章状态"
            label-width="220rpx"
            prop="status"
            :dict-type="DICT_TYPE.OA_SEAL_STATUS"
            placeholder="请选择印章状态"
          />
          <wd-form-item title="购买时间" title-width="220rpx" prop="purchaseTime">
            <view class="flex items-center justify-end gap-12rpx" @click="purchaseVisible = true">
              <text class="text-28rpx" :class="purchaseTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ purchaseTime === '' ? '请选择购买时间' : formatDateTime(purchaseTime) }}
              </text>
              <text v-if="purchaseTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="purchaseTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="启用时间" title-width="220rpx" prop="enableTime">
            <view class="flex items-center justify-end gap-12rpx" @click="enableVisible = true">
              <text class="text-28rpx" :class="enableTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ enableTime === '' ? '请选择启用时间' : formatDateTime(enableTime) }}
              </text>
              <text v-if="enableTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="enableTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="停用时间" title-width="220rpx" prop="disableTime">
            <view class="flex items-center justify-end gap-12rpx" @click="disableVisible = true">
              <text class="text-28rpx" :class="disableTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ disableTime === '' ? '请选择停用时间' : formatDateTime(disableTime) }}
              </text>
              <text v-if="disableTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="disableTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="印章照片" title-width="220rpx" prop="picUrl">
            <yd-upload-img v-model="formData.picUrl" directory="oa/seal" />
          </wd-form-item>
          <wd-form-item title="显示顺序" title-width="220rpx" prop="sort">
            <wd-input-number
              v-model="formData.sort"
              :min="0"
              :precision="0"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入备注"
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="purchaseTime" v-model:visible="purchaseVisible" type="datetime" title="购买时间" />
      <wd-datetime-picker v-model="enableTime" v-model:visible="enableVisible" type="datetime" title="启用时间" />
      <wd-datetime-picker v-model="disableTime" v-model:visible="disableVisible" type="datetime" title="停用时间" />
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
import type { Seal } from '@/api/oa/seal'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createSeal, getSeal, updateSeal } from '@/api/oa/seal'
import { DeptFormPicker, UserFormPicker } from '@/components/system-select'
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
const getTitle = computed(() => props.id ? '编辑印章' : '新增印章')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<Seal>>({
  id: undefined,
  deptId: undefined,
  name: '',
  type: undefined,
  category: undefined,
  keeperUserId: undefined,
  keeperDeptId: undefined,
  status: 0,
  picUrl: '',
  sort: 0,
  remark: '',
}) // 表单数据
const purchaseTime = ref<number | ''>('') // 购买时间选择器值，空字符串承接未选择
const enableTime = ref<number | ''>('') // 启用时间选择器值，空字符串承接未选择
const disableTime = ref<number | ''>('') // 停用时间选择器值，空字符串承接未选择
const purchaseVisible = ref(false) // 购买时间选择器显示状态
const enableVisible = ref(false) // 启用时间选择器显示状态
const disableVisible = ref(false) // 停用时间选择器显示状态
const formSchema = createFormSchema({
  deptId: [{ required: true, message: '所属部门不能为空' }],
  name: [{ required: true, message: '印章名称不能为空' }, { max: 128 }],
  type: [{ required: true, message: '印章类型不能为空' }],
  keeperUserId: [{ required: true, message: '保管人不能为空' }],
  keeperDeptId: [{ required: true, message: '保管部门不能为空' }],
  status: [{ required: true, message: '印章状态不能为空' }],
  sort: [{ required: true, message: '显示顺序不能为空' }],
  remark: [{ max: 500 }],
}) // 表单校验规则
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/seal/info/index')
}

/** 加载印章详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getSeal(Number(props.id))
  formData.value = data
  purchaseTime.value = data.purchaseTime ? toTimestamp(data.purchaseTime) : ''
  enableTime.value = data.enableTime ? toTimestamp(data.enableTime) : ''
  disableTime.value = data.disableTime ? toTimestamp(data.disableTime) : ''
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      purchaseTime: purchaseTime.value === '' ? undefined : purchaseTime.value,
      enableTime: enableTime.value === '' ? undefined : enableTime.value,
      disableTime: disableTime.value === '' ? undefined : disableTime.value,
    } as unknown as Seal
    if (props.id) {
      await updateSeal(data)
      toast.success('修改成功')
    } else {
      await createSeal(data)
      toast.success('新增成功')
    }
    uni.$emit('oa:seal:reload')
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
