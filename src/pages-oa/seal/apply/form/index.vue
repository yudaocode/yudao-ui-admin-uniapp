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
          <wd-form-item title="印章" title-width="220rpx" prop="sealId">
            <view class="flex items-center justify-end gap-12rpx" @click="openSealPicker">
              <text class="text-28rpx" :class="selectedSealName ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedSealName || '请选择印章' }}
              </text>
              <wd-icon name="arrow-right" size="26rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="用印事由" title-width="220rpx" prop="reason">
            <wd-textarea
              v-model="formData.reason"
              clearable
              :maxlength="500"
              show-word-limit
              placeholder="请输入用印事由"
            />
          </wd-form-item>
          <yd-form-picker
            v-model="formData.type"
            label="用印类型"
            label-width="220rpx"
            prop="type"
            :dict-type="DICT_TYPE.OA_SEAL_APPLY_TYPE"
            placeholder="请选择用印类型"
          />
          <yd-form-picker
            v-model="formData.mode"
            label="用印方式"
            label-width="220rpx"
            prop="mode"
            :dict-type="DICT_TYPE.OA_SEAL_USE_MODE"
            placeholder="请选择用印方式"
          />
          <wd-form-item title="文件标题" title-width="220rpx" prop="documentTitle">
            <wd-input
              v-model="formData.documentTitle"
              clearable
              :maxlength="255"
              placeholder="请输入文件标题"
            />
          </wd-form-item>
          <wd-form-item title="文件类型" title-width="220rpx" prop="documentType">
            <wd-input
              v-model="formData.documentType"
              clearable
              :maxlength="64"
              placeholder="请输入文件类型"
            />
          </wd-form-item>
          <wd-form-item title="文件份数" title-width="220rpx" prop="documentCount">
            <wd-input-number
              v-model="formData.documentCount"
              :min="1"
              :precision="0"
              placeholder="请输入文件份数"
            />
          </wd-form-item>
          <wd-form-item v-if="formData.type === OA_SEAL_APPLY_TYPE.CONTRACT" title="合同金额（元）" title-width="220rpx" prop="contractPrice">
            <wd-input-number
              v-model="formData.contractPrice"
              allow-null
              :min="0"
              :precision="2"
              placeholder="请输入合同金额"
            />
          </wd-form-item>
          <wd-form-item v-if="formData.type === OA_SEAL_APPLY_TYPE.CONTRACT" title="合同对方" title-width="220rpx" prop="contractParty">
            <wd-input
              v-model="formData.contractParty"
              clearable
              :maxlength="255"
              placeholder="请输入合同对方"
            />
          </wd-form-item>
          <wd-form-item title="预计用印时间" title-width="220rpx" prop="expectedUseTime">
            <view class="flex items-center justify-end gap-12rpx" @click="expectedUseVisible = true">
              <text class="text-28rpx" :class="expectedUseTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ expectedUseTime === '' ? '请选择预计用印时间' : formatDateTime(expectedUseTime) }}
              </text>
              <text v-if="expectedUseTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="expectedUseTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item v-if="formData.mode === OA_SEAL_USE_MODE.BORROW" title="预计归还时间" title-width="220rpx" prop="expectedReturnTime">
            <view class="flex items-center justify-end gap-12rpx" @click="expectedReturnVisible = true">
              <text class="text-28rpx" :class="expectedReturnTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ expectedReturnTime === '' ? '请选择预计归还时间' : formatDateTime(expectedReturnTime) }}
              </text>
              <text v-if="expectedReturnTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="expectedReturnTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="实际归还时间" title-width="220rpx" prop="actualReturnTime">
            <view class="flex items-center justify-end gap-12rpx" @click="actualReturnVisible = true">
              <text class="text-28rpx" :class="actualReturnTime === '' ? 'text-[#999]' : 'text-[#333]'">
                {{ actualReturnTime === '' ? '请选择实际归还时间' : formatDateTime(actualReturnTime) }}
              </text>
              <text v-if="actualReturnTime !== ''" class="shrink-0 text-26rpx text-[#1677ff]" @click.stop="actualReturnTime = ''">
                清除
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="是否紧急" title-width="220rpx" prop="urgent">
            <wd-radio-group v-model="formData.urgent" type="button">
              <wd-radio :value="true">
                是
              </wd-radio>
              <wd-radio :value="false">
                否
              </wd-radio>
            </wd-radio-group>
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
          <wd-form-item title="附件" title-width="220rpx" prop="fileUrls">
            <yd-upload-file v-model="formData.fileUrls" :limit="5" directory="oa/seal-apply" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <wd-datetime-picker v-model="expectedUseTime" v-model:visible="expectedUseVisible" type="datetime" title="预计用印时间" />
      <wd-datetime-picker v-model="expectedReturnTime" v-model:visible="expectedReturnVisible" type="datetime" title="预计归还时间" />
      <wd-datetime-picker v-model="actualReturnTime" v-model:visible="actualReturnVisible" type="datetime" title="实际归还时间" />
    </view>

    <!-- 印章选择弹窗 -->
    <wd-popup
      v-model="sealPickerVisible"
      position="bottom"
      root-portal
      custom-style="height: 70vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col">
        <view class="flex items-center justify-between px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">选择印章</text>
          <wd-icon name="close" size="32rpx" color="#999" @click="sealPickerVisible = false" />
        </view>
        <view class="px-24rpx pb-16rpx">
          <wd-search
            v-model="sealQueryParams.name"
            placeholder="搜索印章名称"
            hide-cancel
            @search="handleSealQuery"
            @clear="handleSealQuery"
          />
        </view>
        <z-paging
          ref="sealPagingRef"
          v-model="sealList"
          :fixed="false"
          class="min-h-0 flex-1"
          :default-page-size="10"
          empty-view-text="暂无可申请印章"
          @query="querySealList"
        >
          <view class="p-24rpx pt-0">
            <view
              v-for="item in sealList"
              :key="item.id"
              class="mb-16rpx flex items-center justify-between rounded-12rpx bg-[#f7f8fa] p-24rpx"
              @click="handleSealSelect(item)"
            >
              <view class="min-w-0 flex-1">
                <view class="line-clamp-1 text-30rpx text-[#333] font-semibold">
                  {{ item.name }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.no || '-' }} · {{ item.deptName || '-' }}
                </view>
              </view>
              <wd-icon v-if="item.id === formData.sealId" name="check" size="32rpx" color="#1677ff" />
            </view>
          </view>
        </z-paging>
      </view>
    </wd-popup>

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
import type { Seal } from '@/api/oa/seal'
import type { SealApply } from '@/api/oa/seal-apply'
import { computed, onMounted, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createSealApply, getAvailableSealPage, getSealApply, updateSealApply } from '@/api/oa/seal-apply'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { OA_SEAL_APPLY_TYPE, OA_SEAL_USE_MODE } from '../../../utils/constants'
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
const getTitle = computed(() => props.id ? '编辑用印申请' : '新增用印申请')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<SealApply>>({
  id: undefined,
  sealId: undefined,
  reason: '',
  type: OA_SEAL_APPLY_TYPE.CONTRACT, // 默认合同
  mode: OA_SEAL_USE_MODE.ONSITE, // 默认现场用印
  documentTitle: '',
  documentType: '',
  documentCount: 1,
  contractPrice: undefined,
  contractParty: '',
  urgent: false,
  remark: '',
  fileUrls: [],
}) // 表单数据
const expectedUseTime = ref<number | ''>('') // 预计用印时间选择器值，空字符串承接未选择
const expectedReturnTime = ref<number | ''>('') // 预计归还时间选择器值，空字符串承接未选择
const actualReturnTime = ref<number | ''>('') // 实际归还时间选择器值，空字符串承接未选择
const expectedUseVisible = ref(false) // 预计用印时间选择器显示状态
const expectedReturnVisible = ref(false) // 预计归还时间选择器显示状态
const actualReturnVisible = ref(false) // 实际归还时间选择器显示状态
const formSchema = createFormSchema({ // 表单校验规则
  sealId: [{ required: true, message: '印章不能为空' }],
  reason: [{ required: true, message: '用印事由不能为空' }, { max: 500 }],
  type: [{ required: true, message: '用印类型不能为空' }],
  mode: [{ required: true, message: '用印方式不能为空' }],
  documentTitle: [{ max: 255 }],
  documentType: [{ max: 64 }],
  documentCount: [{ required: true, message: '文件份数不能为空' }],
  contractParty: [{ max: 255 }],
  remark: [{ max: 500 }],
})
const formRef = ref<FormInstance>() // 表单组件引用

// ==================== 印章选择 ====================
const sealPickerVisible = ref(false) // 印章选择弹窗显示状态
const sealList = ref<Seal[]>([]) // 可申请印章列表
const sealPagingRef = ref<any>() // 印章分页组件引用
const sealQueryParams = ref<Record<string, any>>({}) // 印章查询参数
const selectedSealName = ref('') // 已选印章名称回显

/** 打开印章选择弹窗 */
function openSealPicker() {
  sealPickerVisible.value = true
  sealPagingRef.value?.reload()
}

/** 查询可申请印章列表 */
async function querySealList(pageNo: number, pageSize: number) {
  try {
    const data = await getAvailableSealPage({
      ...sealQueryParams.value,
      pageNo,
      pageSize,
    })
    sealPagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    sealPagingRef.value?.complete(false)
  }
}

/** 搜索印章 */
function handleSealQuery() {
  sealPagingRef.value?.reload()
}

/** 选择印章 */
function handleSealSelect(item: Seal) {
  formData.value.sealId = item.id
  selectedSealName.value = item.name || ''
  sealPickerVisible.value = false
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-oa/seal/apply/index')
}

/** 加载用印申请详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const data = await getSealApply(Number(props.id))
  formData.value = data
  selectedSealName.value = data.sealName || ''
  expectedUseTime.value = data.expectedUseTime ? toTimestamp(data.expectedUseTime) : ''
  expectedReturnTime.value = data.expectedReturnTime ? toTimestamp(data.expectedReturnTime) : ''
  actualReturnTime.value = data.actualReturnTime ? toTimestamp(data.actualReturnTime) : ''
}

/** 提交表单：保存为草稿，提交审批在详情页操作 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (expectedUseTime.value === '') {
    toast.warning('请选择预计用印时间')
    return
  }

  formLoading.value = true
  try {
    // 时间戳由后端 Jackson 反序列化为 LocalDateTime
    const data = {
      ...formData.value,
      expectedUseTime: expectedUseTime.value,
      expectedReturnTime: expectedReturnTime.value === '' ? undefined : expectedReturnTime.value,
      actualReturnTime: actualReturnTime.value === '' ? undefined : actualReturnTime.value,
    } as unknown as SealApply
    if (props.id) {
      await updateSealApply(data)
      toast.success('修改成功')
    } else {
      await createSealApply(data)
      toast.success('保存成功')
    }
    uni.$emit('oa:seal-apply:reload')
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
