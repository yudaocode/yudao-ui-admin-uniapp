<template>
  <view class="mx-24rpx mt-24rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <view class="text-30rpx text-[#333] font-semibold">
        工序记录（{{ total }}）
      </view>
      <wd-button v-if="editable" size="small" type="primary" variant="plain" @click="openForm()">
        新增工序
      </wd-button>
    </view>

    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      height="640rpx"
      :default-page-size="5"
      :refresher-enabled="false"
      :inside-more="true"
      :to-bottom-loading-more-enabled="false"
      loading-more-default-text="点击加载更多"
      loading-more-no-more-text="没有更多工序记录了"
      empty-view-text="暂无工序记录"
      @query="queryList"
    >
      <view class="pb-8rpx">
        <view v-for="item in list" :key="item.id" class="mb-16rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-20rpx">
            <view class="mb-12rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-28rpx text-[#333] font-semibold">
                  {{ item.processName || '未选择工序' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  序号 {{ item.sort ?? '-' }}，{{ item.processCode || '-' }}
                </view>
              </view>
              <view v-if="editable" class="flex shrink-0 gap-12rpx">
                <wd-button size="small" type="warning" variant="plain" @click="openForm(item)">
                  编辑
                </wd-button>
                <wd-button size="small" type="danger" variant="plain" @click="removeProcess(item)">
                  删除
                </wd-button>
              </view>
            </view>
            <view class="text-24rpx text-[#666] space-y-6rpx">
              <view>进入：{{ formatDateTime(item.inputTime) || '-' }}</view>
              <view>出工序：{{ formatDateTime(item.outputTime) || '-' }}</view>
              <view>数量：投入 {{ item.inputQuantity ?? '-' }}，产出 {{ item.outputQuantity ?? '-' }}，不良 {{ item.unqualifiedQuantity ?? '-' }}</view>
              <view>工位：{{ item.workstationCode || '-' }} / {{ item.workstationName || '-' }}</view>
              <view>操作人：{{ item.nickname || '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 工序记录表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="formVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formTitle }}
          </view>
          <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="序号" title-width="220rpx" prop="sort" center>
                <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
              </wd-form-item>
              <ProcessFormPicker v-model="formData.processId" label="工序" label-width="220rpx" prop="processId" placeholder="请选择工序" />
              <wd-form-item title="进入时间" title-width="220rpx" prop="inputTime" is-link :value="formatDateTime(formData.inputTime) || ''" placeholder="请选择进入时间" @click="dateVisible.inputTime = true" />
              <wd-datetime-picker v-model="formData.inputTime" v-model:visible="dateVisible.inputTime" title="请选择进入时间" type="datetime" />
              <wd-form-item title="出工序时间" title-width="220rpx" prop="outputTime" is-link :value="formatDateTime(formData.outputTime) || ''" placeholder="请选择出工序时间" @click="dateVisible.outputTime = true" />
              <wd-datetime-picker v-model="formData.outputTime" v-model:visible="dateVisible.outputTime" title="请选择出工序时间" type="datetime" />
              <wd-form-item title="投入数量" title-width="220rpx" prop="inputQuantity" center>
                <wd-input-number
                  :model-value="formData.inputQuantity ?? ''"
                  allow-null
                  :min="0"
                  :precision="2"
                  @update:model-value="value => formData.inputQuantity = toFiniteNumber(value)"
                />
              </wd-form-item>
              <wd-form-item title="产出数量" title-width="220rpx" prop="outputQuantity" center>
                <wd-input-number
                  :model-value="formData.outputQuantity ?? ''"
                  allow-null
                  :min="0"
                  :precision="2"
                  @update:model-value="value => formData.outputQuantity = toFiniteNumber(value)"
                />
              </wd-form-item>
              <wd-form-item title="不良数量" title-width="220rpx" prop="unqualifiedQuantity" center>
                <wd-input-number
                  :model-value="formData.unqualifiedQuantity ?? ''"
                  allow-null
                  :min="0"
                  :precision="2"
                  @update:model-value="value => formData.unqualifiedQuantity = toFiniteNumber(value)"
                />
              </wd-form-item>
              <WorkstationFormPicker v-model="formData.workstationId" label="工位" label-width="220rpx" prop="workstationId" placeholder="请选择工位" />
              <UserPicker v-model="formData.userId" label="操作人" label-width="220rpx" prop="userId" type="radio" placeholder="请选择操作人" />
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-60rpx" />
        </scroll-view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProCardProcess } from '@/api/mes/pro/card/process'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, ref } from 'vue'
import { createCardProcess, deleteCardProcess, getCardProcessPage, updateCardProcess } from '@/api/mes/pro/card/process'
import { formatDateTime, toTimestamp } from '@/utils/date'
import { toFiniteNumber } from '@/utils/format'
import { createFormSchema } from '@/utils/wot'
import ProcessFormPicker from '@/pages-mes/pro/process/components/process-form-picker.vue'
import WorkstationFormPicker from '@/pages-mes/pro/task/components/workstation-form-picker.vue'

const props = defineProps<{
  cardId: number
  editable?: boolean
}>()

const emit = defineEmits<{
  changed: []
}>()

const dialog = useDialog()
const toast = useToast()
const list = ref<ProCardProcess[]>([]) // 工序记录列表
const total = ref(0) // 工序记录总数
const pagingRef = ref<ZPagingRef<ProCardProcess>>() // 分页组件引用
const formVisible = ref(false) // 表单弹层
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const dateVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const formData = ref<ProCardProcess>(createDefaultFormData(1)) // 表单数据
const formTitle = computed(() => formData.value.id ? '编辑工序记录' : '新增工序记录')
const formSchema = createFormSchema({
  sort: [{ required: true, message: '序号不能为空' }],
  inputTime: [
    {
      validator: (value, model) => {
        if (!value || !model.outputTime) {
          return true
        }
        const inputTime = toTimestamp(String(value))
        const outputTime = toTimestamp(String(model.outputTime))
        return inputTime <= outputTime || '进入时间不能晚于出工序时间'
      },
    },
  ],
  outputQuantity: [
    {
      validator: (value, model) => {
        if (value === undefined || value === null || model.inputQuantity === undefined || model.inputQuantity === null) {
          return true
        }
        return Number(value) <= Number(model.inputQuantity) || '产出数量不能大于投入数量'
      },
    },
  ],
  unqualifiedQuantity: [
    {
      validator: (value, model) => {
        if (value === undefined || value === null || model.outputQuantity === undefined || model.outputQuantity === null) {
          return true
        }
        return Number(value) <= Number(model.outputQuantity) || '不良数量不能大于产出数量'
      },
    },
  ],
})

/** 创建默认表单数据 */
function createDefaultFormData(sort: number): ProCardProcess {
  return {
    cardId: props.cardId,
    sort,
  }
}

/** 查询工序记录 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.cardId) {
    total.value = 0
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getCardProcessPage({
      cardId: props.cardId,
      pageNo,
      pageSize,
    })
    total.value = data.total
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 打开工序记录表单 */
function openForm(row?: ProCardProcess) {
  const data = createDefaultFormData(row?.sort || total.value + 1)
  formData.value = {
    ...data,
    ...row,
  }
  formVisible.value = true
  nextTick(() => formRef.value?.reset())
}

/** 提交工序记录 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (formData.value.id) {
      await updateCardProcess(formData.value)
      toast.success('修改成功')
    } else {
      await createCardProcess(formData.value)
      toast.success('新增成功')
    }
    formVisible.value = false
    pagingRef.value?.reload()
    emit('changed')
  } finally {
    formLoading.value = false
  }
}

/** 删除工序记录 */
async function removeProcess(item: ProCardProcess) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.processName || item.processCode || item.sort}」工序记录吗？` })
  } catch {
    return
  }
  await deleteCardProcess(item.id)
  toast.success('删除成功')
  pagingRef.value?.reload()
  emit('changed')
}
</script>
