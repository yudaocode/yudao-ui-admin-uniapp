<template>
  <!-- 快捷编辑弹窗 -->
  <wd-popup
    v-model="visible"
    position="bottom"
    root-portal
    custom-style="border-radius: 24rpx 24rpx 0 0;"
  >
    <view class="p-32rpx">
      <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
        快捷编辑
      </view>
      <wd-cell-group border>
        <yd-form-picker
          v-model="formData.priority"
          label="优先级"
          :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
          placeholder="请选择优先级"
        />
        <yd-form-picker
          v-model="formData.statusId"
          label="状态"
          :columns="statusColumns"
          placeholder="请选择状态"
        />
        <ProjectMemberFormPicker
          v-model="formData.assigneeUserId"
          :project-id="workItem?.projectId"
          label="负责人"
          clearable
        />
        <wd-cell title="截止时间" title-width="220rpx">
          <view
            class="flex items-center justify-end gap-12rpx"
            @click="endTimeVisible = true"
          >
            <text
              class="text-28rpx"
              :class="formData.endTime === '' ? 'text-[#999]' : 'text-[#333]'"
            >
              {{
                formData.endTime === ""
                  ? "请选择截止时间"
                  : formatDateTime(formData.endTime)
              }}
            </text>
            <text
              v-if="formData.endTime !== ''"
              class="shrink-0 text-26rpx text-[#1677ff]"
              @click.stop="formData.endTime = ''"
            >
              清空
            </text>
          </view>
        </wd-cell>
      </wd-cell-group>
      <view class="mt-32rpx flex gap-24rpx">
        <wd-button class="flex-1" variant="plain" @click="visible = false">
          取消
        </wd-button>
        <wd-button
          class="flex-1"
          type="primary"
          :loading="saving"
          @click="handleSubmit"
        >
          保存
        </wd-button>
      </view>
    </view>
    <wd-datetime-picker
      v-model="formData.endTime"
      v-model:visible="endTimeVisible"
      type="datetime"
      title="截止时间"
    />
  </wd-popup>
</template>

<script lang="ts" setup>
import type { WorkbenchWorkItem } from "@/api/pms/pm/workbench";
import { ref } from "vue";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import {
  getWorkItem,
  updateWorkItem,
  updateWorkItemStatus,
} from "@/api/pms/pm/workitem";
import { getWorkItemStatusList } from "@/api/pms/pm/workitem/status";
import ProjectMemberFormPicker from "@/pages-pms/pm/project/components/project-member-form-picker.vue";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import { formatDateTime, toTimestamp } from "@/utils/date";

const emit = defineEmits<{ success: [] }>(); // 保存成功事件，供列表刷新

const toast = useToast();
const visible = ref(false); // 弹窗显示状态
const saving = ref(false); // 保存中
const endTimeVisible = ref(false); // 截止时间选择器显示状态
const workItem = ref<WorkbenchWorkItem>(); // 当前编辑的工作项
const statusColumns = ref<Array<{ label: string; value: number }>>([]); // 状态选项
const formData = ref({
  priority: 0 as number,
  statusId: 0 as number,
  assigneeUserId: undefined as number | undefined,
  endTime: "" as number | "",
}); // 快捷编辑表单

/** 打开弹窗 */
async function open(item: WorkbenchWorkItem) {
  workItem.value = item;
  formData.value = {
    priority: item.priority,
    statusId: item.statusId,
    assigneeUserId: item.assigneeUserId,
    endTime: item.endTime ? toTimestamp(item.endTime) : "",
  };
  visible.value = true;
  const statuses = await getWorkItemStatusList(item.projectId, item.type);
  statusColumns.value = statuses.map((status) => ({
    label: status.name,
    value: status.id,
  }));
}

/** 保存快捷编辑 */
async function handleSubmit() {
  const item = workItem.value;
  if (!item) {
    return;
  }
  saving.value = true;
  try {
    if (formData.value.statusId !== item.statusId) {
      await updateWorkItemStatus(item.id, formData.value.statusId);
    }
    const current = await getWorkItem(item.id);
    await updateWorkItem({
      ...current,
      priority: formData.value.priority,
      assigneeUserId: formData.value.assigneeUserId,
      endTime: formData.value.endTime || undefined,
    });
    toast.success("工作项已更新");
    visible.value = false;
    emit("success");
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>
