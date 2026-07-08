<template>
  <view class="mt-24rpx bg-white">
    <view v-if="showTitle || editable" class="flex items-center justify-between px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        <template v-if="showTitle">
          组成工序
        </template>
      </view>
      <wd-button v-if="editable" size="small" type="primary" variant="plain" @click="openForm('create')">
        添加工序
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      暂无组成工序
    </view>
    <view v-else class="px-24rpx pb-8rpx">
      <view v-for="item in list" :key="item.id" class="mb-16rpx rounded-12rpx bg-[#f8fafc] p-20rpx">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-30rpx text-[#333] font-semibold">
              {{ item.sort }}. {{ item.processName || '-' }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ item.processCode || '-' }}
            </view>
          </view>
          <view class="flex shrink-0 gap-12rpx">
            <wd-button v-if="editable" size="small" type="warning" variant="plain" @click="openForm('update', item)">
              编辑
            </wd-button>
            <wd-button v-if="editable" size="small" type="danger" variant="plain" @click="handleDelete(item)">
              删除
            </wd-button>
          </view>
        </view>
        <view class="text-26rpx text-[#666] space-y-8rpx">
          <view>下一道工序：{{ item.nextProcessName || '-' }}</view>
          <view>
            与下道关系：
            <dict-tag v-if="item.linkType != null" :type="DICT_TYPE.MES_PRO_LINK_TYPE" :value="item.linkType" />
            <text v-else>-</text>
          </view>
          <view class="flex gap-24rpx">
            <view>
              关键工序：<dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="item.keyFlag" />
            </view>
            <view>
              质检确认：<dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="item.checkFlag" />
            </view>
          </view>
          <view>准备/等待：{{ item.prepareTime ?? 0 }} / {{ item.waitTime ?? 0 }} 分钟</view>
          <view class="flex items-center gap-8rpx">
            <text>甘特图颜色：</text>
            <view v-if="item.colorCode" class="h-24rpx w-40rpx rounded-4rpx" :style="{ backgroundColor: item.colorCode }" />
            <text>{{ item.colorCode || '-' }}</text>
          </view>
          <view v-if="item.remark">
            备注：{{ item.remark }}
          </view>
        </view>
      </view>
    </view>
  </view>

  <wd-popup v-model="formVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 86vh;">
    <view class="max-h-[86vh] flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">{{ formTitle }}</text>
        <wd-icon name="close" size="36rpx" @click="formVisible = false" />
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="序号" title-width="220rpx" prop="sort" center>
              <wd-input-number v-model="formData.sort" :min="1" :precision="0" />
            </wd-form-item>
            <ProcessFormPicker v-model="formData.processId" label="工序" label-width="220rpx" prop="processId" placeholder="请选择工序" @change="handleProcessChange" />
            <ProcessFormPicker v-model="formData.nextProcessId" label="下一道工序" label-width="220rpx" prop="nextProcessId" placeholder="请选择下一道工序" clearable />
            <yd-form-picker v-model="formData.linkType" label="与下道关系" label-width="220rpx" prop="linkType" :dict-type="DICT_TYPE.MES_PRO_LINK_TYPE" placeholder="请选择与下道关系" />
            <wd-cell title="关键工序" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.keyFlag" />
              </view>
            </wd-cell>
            <wd-cell title="质检确认" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.checkFlag" />
              </view>
            </wd-cell>
            <wd-form-item title="准备时间" title-width="220rpx" prop="prepareTime" center>
              <view class="flex items-center gap-12rpx">
                <wd-input-number v-model="formData.prepareTime" allow-null :min="0" :precision="0" />
                <text class="text-26rpx text-[#999]">分钟</text>
              </view>
            </wd-form-item>
            <wd-form-item title="等待时间" title-width="220rpx" prop="waitTime" center>
              <view class="flex items-center gap-12rpx">
                <wd-input-number v-model="formData.waitTime" allow-null :min="0" :precision="0" />
                <text class="text-26rpx text-[#999]">分钟</text>
              </view>
            </wd-form-item>
            <wd-form-item title="甘特图颜色" title-width="220rpx" prop="colorCode">
              <wd-input v-model="formData.colorCode" placeholder="请输入颜色，如 #00AEF3" clearable />
            </wd-form-item>
            <view class="flex flex-wrap gap-12rpx px-24rpx pb-20rpx">
              <view v-for="color in colorOptions" :key="color" class="h-44rpx w-64rpx border-2rpx rounded-8rpx" :class="formData.colorCode === color ? 'border-[#1677ff]' : 'border-transparent'" :style="{ backgroundColor: color }" @click="formData.colorCode = color" />
            </view>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="h-120rpx" />
      </scroll-view>
      <view class="p-24rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProRouteProcess } from '@/api/mes/pro/route/process'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  createRouteProcess,
  deleteRouteProcess,
  getRouteProcessListByRoute,
  updateRouteProcess,
} from '@/api/mes/pro/route/process'
import { DICT_TYPE, MesProLinkTypeEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import ProcessFormPicker from '@/pages-mes/pro/process/components/process-form-picker.vue'

const props = withDefaults(defineProps<{
  editable: boolean
  routeId: number
  showTitle?: boolean
}>(), {
  showTitle: true,
})
const dialog = useDialog()
const toast = useToast()
const list = ref<ProRouteProcess[]>([]) // 工序列表
const loading = ref(false) // 列表加载状态
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formData = ref<ProRouteProcess>(createDefaultFormData(props.routeId, 1)) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const colorOptions = ['#00AEF3', '#67C23A', '#E6A23C', '#F56C6C', '#909399'] // 甘特图预设色
const formTitle = computed(() => formType.value === 'create' ? '添加工序' : '编辑工序')
const formSchema = createFormSchema({
  sort: [
    { required: true, message: '序号不能为空' },
    { validator: value => Number(value) >= 1 || '序号必须大于 0' },
  ],
  processId: [{ required: true, message: '工序不能为空' }],
  nextProcessId: [
    { validator: value => value == null || value !== formData.value.processId || '下一道工序不能与当前工序相同' },
  ],
  linkType: [{ required: true, message: '工序关系不能为空' }],
  keyFlag: [{ required: true, message: '是否关键工序不能为空' }],
  checkFlag: [{ required: true, message: '是否需要质检确认不能为空' }],
  colorCode: [{ pattern: /^#[0-9a-f]{6}$/i, message: '颜色格式应为 #RRGGBB' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(routeId: number, sort: number): ProRouteProcess {
  return {
    routeId,
    sort,
    linkType: MesProLinkTypeEnum.FINISH_START,
    colorCode: '#00AEF3',
    keyFlag: false,
    checkFlag: false,
  }
}

/** 加载路线工序列表 */
async function getList() {
  if (!props.routeId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getRouteProcessListByRoute(props.routeId)
    list.value = [...(data || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  } finally {
    loading.value = false
  }
}

/** 刷新列表 */
function reload() {
  getList()
}

/** 打开新增或编辑弹层 */
function openForm(type: 'create' | 'update', row?: ProRouteProcess) {
  formType.value = type
  const maxSort = list.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  formData.value = {
    ...createDefaultFormData(props.routeId, row?.sort || maxSort + 1),
    ...row,
    colorCode: row?.colorCode || '#00AEF3',
  }
  formVisible.value = true
  nextTick(() => formRef.value?.reset())
}

/** 选择工序 */
function handleProcessChange() {
  if (formData.value.nextProcessId === formData.value.processId) {
    formData.value.nextProcessId = undefined
  }
}

/** 提交路线工序 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  if (formType.value === 'update' && !formData.value.id) {
    toast.error('缺少路线工序编号')
    return
  }

  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await createRouteProcess(formData.value)
      toast.success('新增成功')
    } else {
      await updateRouteProcess(formData.value)
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除路线工序 */
async function handleDelete(item: ProRouteProcess) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.processName || item.processCode || item.sort}」工序吗？` })
  } catch {
    return
  }
  await deleteRouteProcess(item.id)
  toast.success('删除成功')
  await getList()
}

/** 监听路线编号变化 */
watch(() => props.routeId, reload)

/** 初始化 */
onMounted(async () => {
  await getList()
})

/** 监听刷新事件 */
onMounted(() => {
  uni.$on('mes:pro:route:reload', reload)
})

/** 卸载 */
onUnmounted(() => {
  uni.$off('mes:pro:route:reload', reload)
})
</script>
