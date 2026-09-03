<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <ProjectSearchPicker
        v-model="formData.projectId"
        @change="handleProjectChange"
      />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label"> 事项 </view>
        <wd-input
          v-model="formData.name"
          placeholder="搜索标题或编号"
          clearable
        />
      </view>
      <yd-search-picker
        v-model="formData.status"
        label="状态"
        :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE)"
        all-option
        all-label="全部状态"
      />
      <yd-search-picker
        v-model="formData.priority"
        label="优先级"
        :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_PRIORITY)"
        all-option
        all-label="全部优先级"
      />
      <IterationSearchPicker
        v-if="formData.projectId"
        v-model="formData.iterationId"
        :project-id="formData.projectId"
        @change="(item) => (iterationName = item?.name || '')"
      />
      <yd-search-date-range v-model="formData.endTime" label="截止日期" />
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { Project } from "@/api/pms/pm/project";
import { computed, reactive, ref } from "vue";
import IterationSearchPicker from "@/pages-pms/pm/iteration/components/iteration-search-picker.vue";
import ProjectSearchPicker from "@/pages-pms/pm/project/components/project-search-picker.vue";
import {} from "@/pages-pms/pm/utils/constants";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import {
  getPriorityName,
  getWorkItemStatusTypeName,
} from "@/pages-pms/pm/utils/format";
import { getTopPopupModalStyle, getTopPopupStyle } from "@/utils";
import { formatDate, formatDateRange } from "@/utils/date";

const emit = defineEmits<{
  search: [data: Record<string, any>];
  reset: [];
}>();

const visible = ref(false); // 搜索弹窗显示状态
const projectName = ref(""); // 已选项目名称，用于 placeholder 展示
const iterationName = ref(""); // 已选迭代名称，用于 placeholder 展示
const formData = reactive({
  projectId: undefined as number | undefined,
  name: undefined as string | undefined,
  status: undefined as number | undefined,
  priority: undefined as number | undefined,
  iterationId: undefined as number | undefined,
  endTime: [undefined, undefined] as [number | undefined, number | undefined],
}); // 搜索表单数据

const placeholder = computed(() => {
  // 搜索条件 placeholder 拼接
  const conditions: string[] = [];
  if (formData.projectId !== undefined) {
    conditions.push(`项目:${projectName.value}`);
  }
  if (formData.name) {
    conditions.push(`事项:${formData.name}`);
  }
  if (formData.status !== undefined) {
    conditions.push(`状态:${getWorkItemStatusTypeName(formData.status)}`);
  }
  if (formData.priority !== undefined) {
    conditions.push(`优先级:${getPriorityName(formData.priority)}`);
  }
  if (formData.iterationId !== undefined) {
    conditions.push(`迭代:${iterationName.value}`);
  }
  if (formData.endTime[0] || formData.endTime[1]) {
    conditions.push(
      `截止:${formatDate(formData.endTime[0]) || "?"}~${formatDate(formData.endTime[1]) || "?"}`,
    );
  }
  return conditions.length > 0 ? conditions.join(" | ") : "搜索标题或编号";
});

/** 切换项目：迭代从属于项目，清空已选迭代 */
function handleProjectChange(item: Project | undefined) {
  projectName.value = item?.name || "";
  formData.iterationId = undefined;
  iterationName.value = "";
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false;
  emit("search", {
    projectId: formData.projectId,
    name: formData.name || undefined,
    status: formData.status,
    priority: formData.priority,
    iterationId: formData.iterationId,
    endTime: formatDateRange(formData.endTime),
  });
}

/** 重置按钮操作（保留项目筛选，对齐 PC resetQuery） */
function handleReset() {
  formData.name = undefined;
  formData.status = undefined;
  formData.priority = undefined;
  formData.iterationId = undefined;
  formData.endTime = [undefined, undefined];
  iterationName.value = "";
  visible.value = false;
  emit("reset");
}
</script>
