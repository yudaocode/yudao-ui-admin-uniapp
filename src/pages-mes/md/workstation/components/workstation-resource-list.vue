<template>
  <view class="min-h-0 flex flex-1 flex-col">
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <!-- 设备资源 -->
      <view v-if="shouldShow('machine')" class="mx-24rpx mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <view class="text-30rpx text-[#333] font-semibold">
            设备资源
          </view>
          <view class="flex items-center gap-12rpx">
            <wd-tag type="primary" plain>
              {{ machineList.length }} 项
            </wd-tag>
            <wd-button v-if="showHeaderAdd" size="small" type="primary" variant="plain" @click="openCreateForm('machine')">
              添加设备
            </wd-button>
          </view>
        </view>
        <view v-if="loading" class="py-40rpx text-center">
          <wd-loading />
        </view>
        <template v-else>
          <view v-for="item in machineList" :key="item.id" class="border-b border-[#f7f7f7] px-24rpx py-20rpx last:border-b-0">
            <view class="mb-8rpx text-28rpx text-[#333] font-medium">
              {{ item.machineryName || '-' }}
            </view>
            <view class="text-26rpx text-[#666] space-y-6rpx">
              <view>设备编码：{{ item.machineryCode || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
            <view v-if="editable" class="mt-16rpx flex justify-end">
              <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete('machine', item)">
                {{ deletingKey === `machine:${item.id}` ? '删除中...' : '删除' }}
              </wd-button>
            </view>
          </view>
          <view v-if="machineList.length === 0" class="py-48rpx text-center">
            <wd-empty icon="content" tip="暂无设备资源" />
          </view>
        </template>
      </view>

      <!-- 工装夹具 -->
      <view v-if="shouldShow('tool')" class="mx-24rpx mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <view class="text-30rpx text-[#333] font-semibold">
            工装夹具
          </view>
          <view class="flex items-center gap-12rpx">
            <wd-tag type="primary" plain>
              {{ toolList.length }} 项
            </wd-tag>
            <wd-button v-if="showHeaderAdd" size="small" type="primary" variant="plain" @click="openCreateForm('tool')">
              添加工具
            </wd-button>
          </view>
        </view>
        <view v-if="loading" class="py-40rpx text-center">
          <wd-loading />
        </view>
        <template v-else>
          <view v-for="item in toolList" :key="item.id" class="border-b border-[#f7f7f7] px-24rpx py-20rpx last:border-b-0">
            <view class="mb-8rpx text-28rpx text-[#333] font-medium">
              {{ item.toolTypeName || '-' }}
            </view>
            <view class="text-26rpx text-[#666] space-y-6rpx">
              <view>工具类型编号：{{ item.toolTypeId || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
            <view v-if="editable" class="mt-16rpx flex justify-end gap-32rpx">
              <wd-button size="small" type="warning" variant="plain" @click.stop="openToolEditForm(item)">
                编辑
              </wd-button>
              <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete('tool', item)">
                {{ deletingKey === `tool:${item.id}` ? '删除中...' : '删除' }}
              </wd-button>
            </view>
          </view>
          <view v-if="toolList.length === 0" class="py-48rpx text-center">
            <wd-empty icon="content" tip="暂无工装夹具" />
          </view>
        </template>
      </view>

      <!-- 人力资源 -->
      <view v-if="shouldShow('worker')" class="mx-24rpx mt-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <view class="text-30rpx text-[#333] font-semibold">
            人力资源
          </view>
          <view class="flex items-center gap-12rpx">
            <wd-tag type="primary" plain>
              {{ workerList.length }} 项
            </wd-tag>
            <wd-button v-if="showHeaderAdd" size="small" type="primary" variant="plain" @click="openCreateForm('worker')">
              添加人员
            </wd-button>
          </view>
        </view>
        <view v-if="loading" class="py-40rpx text-center">
          <wd-loading />
        </view>
        <template v-else>
          <view v-for="item in workerList" :key="item.id" class="border-b border-[#f7f7f7] px-24rpx py-20rpx last:border-b-0">
            <view class="mb-8rpx text-28rpx text-[#333] font-medium">
              {{ item.postName || '-' }}
            </view>
            <view class="text-26rpx text-[#666] space-y-6rpx">
              <view>岗位编号：{{ item.postId || '-' }}</view>
              <view>数量：{{ item.quantity ?? '-' }}</view>
              <view v-if="item.remark">
                备注：{{ item.remark }}
              </view>
            </view>
            <view v-if="editable" class="mt-16rpx flex justify-end gap-32rpx">
              <wd-button size="small" type="warning" variant="plain" @click.stop="openWorkerEditForm(item)">
                编辑
              </wd-button>
              <wd-button size="small" type="danger" variant="plain" @click.stop="handleDelete('worker', item)">
                {{ deletingKey === `worker:${item.id}` ? '删除中...' : '删除' }}
              </wd-button>
            </view>
          </view>
          <view v-if="workerList.length === 0" class="py-48rpx text-center">
            <wd-empty icon="content" tip="暂无人力资源" />
          </view>
        </template>
      </view>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 添加按钮 -->
    <view v-if="showFooterAdd" class="yd-detail-footer">
      <wd-button type="primary" block @click="openCreateForm(currentAddType)">
        {{ currentAddLabel }}
      </wd-button>
    </view>

    <!-- 资源表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 68vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="formVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formTitle }}
          </view>
          <wd-button size="small" type="primary" :loading="saving" @click="handleSubmit">
            保存
          </wd-button>
        </view>

        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item
                v-if="resourceType === 'machine'"
                title="设备"
                title-width="220rpx"
                prop="machineryId"
                is-link
                :value="selectedMachineryText"
                placeholder="请选择设备"
                @click="openMachineryPicker"
              />
              <yd-form-picker
                v-if="resourceType === 'tool'"
                v-model="formData.toolTypeId"
                label="工具类型"
                label-width="220rpx"
                prop="toolTypeId"
                :columns="toolTypeOptions"
                label-key="name"
                value-key="id"
                placeholder="请选择工具类型"
                :disabled="resourceAction === 'update'"
                @confirm="handleToolTypeConfirm"
              />
              <yd-form-picker
                v-if="resourceType === 'worker'"
                v-model="formData.postId"
                label="岗位"
                label-width="220rpx"
                prop="postId"
                :columns="postOptions"
                label-key="name"
                value-key="id"
                placeholder="请选择岗位"
                @confirm="handlePostConfirm"
              />
              <wd-form-item title="数量" title-width="220rpx" prop="quantity" center>
                <wd-input-number v-model="formData.quantity" :min="1" :precision="0" />
              </wd-form-item>
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-48rpx" />
        </scroll-view>
      </view>
    </wd-popup>

    <MachineryPicker ref="machineryPickerRef" :existing-ids="existingMachineryIds" @confirm="handleMachineryConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Post } from '@/api/system/post'
import type { DvMachinery } from '@/api/mes/dv/machinery'
import type { MdWorkstationMachine } from '@/api/mes/md/workstation/machine'
import type { MdWorkstationTool } from '@/api/mes/md/workstation/tool'
import type { MdWorkstationWorker } from '@/api/mes/md/workstation/worker'
import type { TmToolType } from '@/api/mes/tm/tool/type'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { getSimplePostList } from '@/api/system/post'
import {
  createWorkstationMachine,
  deleteWorkstationMachine,
  getWorkstationMachineList,
} from '@/api/mes/md/workstation/machine'
import {
  createWorkstationTool,
  deleteWorkstationTool,
  getWorkstationToolList,
  updateWorkstationTool,
} from '@/api/mes/md/workstation/tool'
import {
  createWorkstationWorker,
  deleteWorkstationWorker,
  getWorkstationWorkerList,
  updateWorkstationWorker,
} from '@/api/mes/md/workstation/worker'
import { getToolTypeSimpleList } from '@/api/mes/tm/tool/type'
import { useAccess } from '@/hooks/useAccess'
import { createFormSchema } from '@/utils/wot'
import MachineryPicker from '../../../dv/machinery/components/machinery-picker.vue'

type ResourceType = 'machine' | 'tool' | 'worker'
type ResourceFilter = ResourceType | 'all'
type ResourceAction = 'create' | 'update'
type ResourceRow = MdWorkstationMachine | MdWorkstationTool | MdWorkstationWorker

interface WorkstationResourceFormData {
  id?: number
  workstationId?: number
  machineryId?: number
  machineryCode?: string
  machineryName?: string
  toolTypeId?: number
  toolTypeName?: string
  postId?: number
  postName?: string
  quantity: number
  remark: string
}

const props = withDefaults(defineProps<{
  workstationId?: number | string
  mode?: 'detail' | 'edit'
  resourceType?: ResourceFilter
}>(), {
  workstationId: undefined,
  mode: 'detail',
  resourceType: 'all',
})

const dialog = useDialog()
const toast = useToast()
const { hasAccessByCodes } = useAccess()
const loading = ref(false) // 资源加载状态
const machineList = ref<MdWorkstationMachine[]>([]) // 设备资源
const toolList = ref<MdWorkstationTool[]>([]) // 工装夹具
const workerList = ref<MdWorkstationWorker[]>([]) // 人力资源
const formVisible = ref(false) // 表单弹层状态
const saving = ref(false) // 保存状态
const deletingKey = ref('') // 删除中资源标识
const resourceType = ref<ResourceType>('machine') // 当前资源类型
const resourceAction = ref<ResourceAction>('create') // 当前表单动作
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<WorkstationResourceFormData>(getDefaultFormData()) // 表单数据
const machineryPickerRef = ref<InstanceType<typeof MachineryPicker>>() // 设备选择器
const toolTypeOptions = ref<TmToolType[]>([]) // 工具类型选项
const postOptions = ref<Post[]>([]) // 岗位选项
const formSchema = createFormSchema({
  machineryId: [{ required: () => resourceType.value === 'machine', message: '设备不能为空' }],
  toolTypeId: [{ required: () => resourceType.value === 'tool', message: '工具类型不能为空' }],
  postId: [{ required: () => resourceType.value === 'worker', message: '岗位不能为空' }],
  quantity: [{ required: true, message: '数量不能为空' }],
})
const editable = computed(() => {
  return props.mode === 'edit'
    && getWorkstationId() !== undefined
    && hasAccessByCodes(['mes:md-workstation:update'])
})
const showHeaderAdd = computed(() => editable.value && props.resourceType === 'all') // 多资源表单页使用分组添加
const showFooterAdd = computed(() => editable.value && props.resourceType !== 'all') // 单资源 tab 使用底部添加
const currentAddType = computed<ResourceType>(() => props.resourceType === 'all' ? 'machine' : props.resourceType)
const currentAddLabel = computed(() => {
  if (currentAddType.value === 'machine') {
    return '添加设备'
  }
  if (currentAddType.value === 'tool') {
    return '添加工具'
  }
  return '添加人员'
})
const existingMachineryIds = computed(() => machineList.value.map(item => item.machineryId))
const selectedMachineryText = computed(() => {
  if (!formData.value.machineryId) {
    return ''
  }
  return `${formData.value.machineryCode || '-'} / ${formData.value.machineryName || ''}`.trim()
})
const formTitle = computed(() => {
  const actionText = resourceAction.value === 'update' ? '编辑' : '添加'
  const resourceText = resourceType.value === 'machine' ? '设备' : resourceType.value === 'tool' ? '工具' : '人员'
  return `${actionText}${resourceText}`
})

/** 是否展示资源类型 */
function shouldShow(type: ResourceType) {
  return props.resourceType === 'all' || props.resourceType === type
}

/** 工作站编号 */
function getWorkstationId() {
  const workstationId = Number(props.workstationId)
  return Number.isFinite(workstationId) && workstationId > 0 ? workstationId : undefined
}

/** 默认表单数据 */
function getDefaultFormData(): WorkstationResourceFormData {
  return {
    workstationId: getWorkstationId(),
    machineryId: undefined,
    machineryCode: '',
    machineryName: '',
    toolTypeId: undefined,
    toolTypeName: '',
    postId: undefined,
    postName: '',
    quantity: 1,
    remark: '',
  }
}

/** 加载三类工作站资源 */
async function loadList() {
  const workstationId = getWorkstationId()
  if (!workstationId) {
    machineList.value = []
    toolList.value = []
    workerList.value = []
    return
  }
  loading.value = true
  try {
    if (shouldShow('machine')) {
      machineList.value = await getWorkstationMachineList(workstationId)
    }
    if (shouldShow('tool')) {
      toolList.value = await getWorkstationToolList(workstationId)
    }
    if (shouldShow('worker')) {
      workerList.value = await getWorkstationWorkerList(workstationId)
    }
  } finally {
    loading.value = false
  }
}

/** 加载资源选择项 */
async function loadResourceOptions(type: ResourceType) {
  if (type === 'tool' && toolTypeOptions.value.length === 0) {
    toolTypeOptions.value = await getToolTypeSimpleList()
  }
  if (type === 'worker' && postOptions.value.length === 0) {
    postOptions.value = await getSimplePostList()
  }
}

/** 打开新增资源 */
async function openCreateForm(type: ResourceType) {
  const workstationId = getWorkstationId()
  if (!workstationId) {
    toast.warning('请先保存工作站')
    return
  }
  resourceType.value = type
  resourceAction.value = 'create'
  formData.value = getDefaultFormData()
  formData.value.workstationId = workstationId
  await loadResourceOptions(type)
  formVisible.value = true
}

/** 打开工具编辑 */
async function openToolEditForm(tool: MdWorkstationTool) {
  resourceType.value = 'tool'
  resourceAction.value = 'update'
  await loadResourceOptions('tool')
  formData.value = {
    id: tool.id,
    workstationId: tool.workstationId,
    toolTypeId: tool.toolTypeId,
    toolTypeName: tool.toolTypeName,
    quantity: tool.quantity,
    remark: tool.remark || '',
  }
  formVisible.value = true
}

/** 打开人员编辑 */
async function openWorkerEditForm(worker: MdWorkstationWorker) {
  resourceType.value = 'worker'
  resourceAction.value = 'update'
  await loadResourceOptions('worker')
  formData.value = {
    id: worker.id,
    workstationId: worker.workstationId,
    postId: worker.postId,
    postName: worker.postName,
    quantity: worker.quantity,
    remark: worker.remark || '',
  }
  formVisible.value = true
}

/** 打开设备选择器 */
function openMachineryPicker() {
  machineryPickerRef.value?.open()
}

/** 确认设备选择 */
function handleMachineryConfirm(item: DvMachinery) {
  formData.value.machineryId = item.id
  formData.value.machineryCode = item.code
  formData.value.machineryName = item.name
}

/** 确认工具类型选择 */
function handleToolTypeConfirm(value?: number | string) {
  const toolTypeId = Number(value)
  if (!Number.isFinite(toolTypeId)) {
    return
  }
  const option = toolTypeOptions.value.find(item => item.id === toolTypeId)
  formData.value.toolTypeId = toolTypeId
  formData.value.toolTypeName = option?.name || ''
}

/** 确认岗位选择 */
function handlePostConfirm(value?: number | string) {
  const postId = Number(value)
  if (!Number.isFinite(postId)) {
    return
  }
  const option = postOptions.value.find(item => item.id === postId)
  formData.value.postId = postId
  formData.value.postName = option?.name || ''
}

/** 构造设备提交数据 */
function buildMachineData(): MdWorkstationMachine | undefined {
  const workstationId = getWorkstationId()
  if (!workstationId || !formData.value.machineryId) {
    return undefined
  }
  return {
    workstationId,
    machineryId: formData.value.machineryId,
    quantity: Number(formData.value.quantity),
    remark: formData.value.remark || undefined,
  }
}

/** 构造工具提交数据 */
function buildToolData(): MdWorkstationTool | undefined {
  const workstationId = getWorkstationId()
  if (!workstationId || !formData.value.toolTypeId) {
    return undefined
  }
  const data: MdWorkstationTool = {
    id: formData.value.id,
    workstationId,
    toolTypeId: formData.value.toolTypeId,
    quantity: Number(formData.value.quantity),
    remark: formData.value.remark || undefined,
  }
  return data
}

/** 构造人员提交数据 */
function buildWorkerData(): MdWorkstationWorker | undefined {
  const workstationId = getWorkstationId()
  if (!workstationId || !formData.value.postId) {
    return undefined
  }
  const data: MdWorkstationWorker = {
    id: formData.value.id,
    workstationId,
    postId: formData.value.postId,
    quantity: Number(formData.value.quantity),
    remark: formData.value.remark || undefined,
  }
  return data
}

/** 提交资源表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  saving.value = true
  try {
    if (resourceType.value === 'machine') {
      const data = buildMachineData()
      if (!data) {
        return
      }
      await createWorkstationMachine(data)
      toast.success('添加成功')
    } else if (resourceType.value === 'tool') {
      const data = buildToolData()
      if (!data) {
        return
      }
      if (resourceAction.value === 'update') {
        await updateWorkstationTool(data)
        toast.success('修改成功')
      } else {
        await createWorkstationTool(data)
        toast.success('添加成功')
      }
    } else {
      const data = buildWorkerData()
      if (!data) {
        return
      }
      if (resourceAction.value === 'update') {
        await updateWorkstationWorker(data)
        toast.success('修改成功')
      } else {
        await createWorkstationWorker(data)
        toast.success('添加成功')
      }
    }
    formVisible.value = false
    await loadList()
  } finally {
    saving.value = false
  }
}

/** 删除资源 */
async function handleDelete(type: ResourceType, row: ResourceRow) {
  const key = `${type}:${row.id}`
  if (deletingKey.value) {
    return
  }
  const label = getResourceLabel(type, row)
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${label || row.id}」吗？`,
      confirmButtonText: '删除',
    })
  } catch {
    return
  }
  deletingKey.value = key
  try {
    if (type === 'machine') {
      await deleteWorkstationMachine(row.id)
    } else if (type === 'tool') {
      await deleteWorkstationTool(row.id)
    } else {
      await deleteWorkstationWorker(row.id)
    }
    toast.success('删除成功')
    await loadList()
  } finally {
    deletingKey.value = ''
  }
}

/** 获取资源名称 */
function getResourceLabel(type: ResourceType, row: ResourceRow) {
  if (type === 'machine' && 'machineryName' in row) {
    return row.machineryName
  }
  if (type === 'tool' && 'toolTypeName' in row) {
    return row.toolTypeName
  }
  if (type === 'worker' && 'postName' in row) {
    return row.postName
  }
  return ''
}

/** 监听工作站编号变化 */
watch(() => [props.workstationId, props.resourceType], loadList, { immediate: true })
</script>
