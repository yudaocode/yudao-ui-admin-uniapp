<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="`${getWorkItemTypeName(type)}状态设置`"
      left-arrow
      placeholder
      safe-area-inset-top
      fixed
      @click-left="handleBack"
    />

    <!-- 配置页签 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex">
        <wd-tab title="状态管理" />
        <wd-tab title="看板配置" />
      </wd-tabs>
    </view>

    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx pb-200rpx">
        <!-- 状态管理 -->
        <template v-if="tabIndex === 0">
          <view class="mb-16rpx text-24rpx text-[#999]">
            状态用于业务流转，初始状态用于新建工作项。
          </view>
          <view class="status-sort-list">
            <view
              v-for="(status, index) in statusList"
              :key="status.id"
              class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            >
              <view class="mb-8rpx flex items-center justify-between gap-16rpx">
                <text
                  class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold"
                >
                  {{ status.name || "未命名" }}
                </text>
                <wd-tag
                  v-if="status.id === defaultStatusId"
                  type="primary"
                  plain
                >
                  初始
                </wd-tag>
              </view>
              <view class="mb-12rpx text-24rpx text-[#999]">
                语义状态：{{ getWorkItemStatusTypeName(status.statusType) }}
                <text v-if="status.description">
                  · {{ status.description }}</text
                >
              </view>
              <view class="flex flex-wrap justify-end gap-12rpx">
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="status.id === defaultStatusId"
                  @click="defaultStatusId = status.id"
                >
                  设为初始
                </wd-button>
                <wd-button
                  size="small"
                  variant="plain"
                  @click="handleEditStatus(status)"
                >
                  编辑
                </wd-button>
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="index === 0"
                  @click="handleMoveStatus(index, -1)"
                >
                  上移
                </wd-button>
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="index === statusList.length - 1"
                  @click="handleMoveStatus(index, 1)"
                >
                  下移
                </wd-button>
                <wd-button
                  size="small"
                  type="danger"
                  variant="plain"
                  :disabled="status.id === defaultStatusId"
                  @click="handleDeleteStatus(status)"
                >
                  删除
                </wd-button>
              </view>
            </view>
          </view>
          <wd-button block variant="plain" @click="handleAddStatus">
            添加状态
          </wd-button>
        </template>

        <!-- 看板配置 -->
        <template v-else>
          <view class="mb-16rpx text-24rpx text-[#999]">
            未放入看板的状态仍可用于工作项流转，但不会显示为看板列。
          </view>
          <view class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-12rpx text-28rpx text-[#666] font-semibold">
              未放入看板
            </view>
            <view class="flex flex-wrap gap-12rpx">
              <wd-tag
                v-for="status in unassignedStatuses"
                :key="status.id"
                plain
              >
                {{ status.name }}
              </wd-tag>
              <text
                v-if="!unassignedStatuses.length"
                class="text-24rpx text-[#999]"
                >无</text
              >
            </view>
          </view>
          <view class="board-sort-list">
            <view
              v-for="(board, index) in boardList"
              :key="board.id"
              class="mb-16rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            >
              <view class="mb-12rpx">
                <wd-input
                  v-model="board.name"
                  placeholder="请输入看板列名称"
                  :maxlength="50"
                />
              </view>
              <view class="mb-12rpx flex flex-wrap items-center gap-12rpx">
                <wd-tag
                  v-for="status in board.statuses"
                  :key="status.id"
                  type="primary"
                  plain
                >
                  {{ status.name }}
                </wd-tag>
                <wd-button
                  size="small"
                  variant="plain"
                  @click="handleAssignBoardStatuses(board)"
                >
                  关联状态
                </wd-button>
              </view>
              <view class="flex justify-end gap-12rpx">
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="index === 0"
                  @click="handleMoveBoard(index, -1)"
                >
                  上移
                </wd-button>
                <wd-button
                  size="small"
                  variant="plain"
                  :disabled="index === boardList.length - 1"
                  @click="handleMoveBoard(index, 1)"
                >
                  下移
                </wd-button>
                <wd-button
                  size="small"
                  type="danger"
                  variant="plain"
                  @click="handleDeleteBoard(index)"
                >
                  删除列
                </wd-button>
              </view>
            </view>
          </view>
          <wd-button block variant="plain" @click="handleAddBoard">
            添加看板列
          </wd-button>
        </template>
      </view>
    </scroll-view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="saving" @click="handleSubmit">
        保存
      </wd-button>
    </view>

    <!-- 状态编辑弹窗 -->
    <wd-popup
      v-model="statusVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          编辑状态
        </view>
        <wd-cell-group border>
          <wd-cell title="状态名称" title-width="200rpx">
            <wd-input
              v-model.trim="statusForm.name"
              placeholder="请输入状态名称"
              :maxlength="50"
            />
          </wd-cell>
          <yd-form-picker
            v-model="statusForm.statusType"
            label="语义状态"
            label-width="200rpx"
            :columns="getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_STATUS_TYPE)"
            placeholder="请选择语义状态"
          />
          <wd-cell title="状态描述" title-width="200rpx">
            <wd-input
              v-model.trim="statusForm.description"
              placeholder="请输入状态描述"
              :maxlength="255"
            />
          </wd-cell>
        </wd-cell-group>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button
            class="flex-1"
            variant="plain"
            @click="statusVisible = false"
          >
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleConfirmStatus">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 看板列关联状态弹窗 -->
    <wd-popup
      v-model="boardStatusVisible"
      position="bottom"
      root-portal
      custom-style="border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          关联状态
        </view>
        <wd-checkbox-group v-model="boardStatusForm.statusIds">
          <wd-cell-group border>
            <wd-checkbox
              v-for="status in assignableStatuses"
              :key="status.id"
              :name="status.id"
              class="py-16rpx"
            >
              {{ status.name }}
            </wd-checkbox>
          </wd-cell-group>
        </wd-checkbox-group>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button
            class="flex-1"
            variant="plain"
            @click="boardStatusVisible = false"
          >
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            @click="handleConfirmBoardStatuses"
          >
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 迁移并删除状态弹窗 -->
    <wd-popup
      v-model="deleteVisible"
      position="center"
      root-portal
      custom-style="width: 640rpx; border-radius: 16rpx;"
    >
      <view class="p-32rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          迁移并删除状态
        </view>
        <wd-cell-group border>
          <wd-cell
            title="待删除状态"
            title-width="200rpx"
            :value="deletingStatus?.name || ''"
          />
          <yd-form-picker
            v-model="deleteForm.transferStatusId"
            label="迁移到"
            label-width="200rpx"
            :columns="transferStatusColumns"
            placeholder="请选择目标状态"
          />
        </wd-cell-group>
        <view class="mt-32rpx flex gap-24rpx">
          <wd-button
            class="flex-1"
            variant="plain"
            @click="deleteVisible = false"
          >
            取消
          </wd-button>
          <wd-button
            class="flex-1"
            type="primary"
            :loading="deleting"
            @click="handleConfirmDelete"
          >
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type {
  WorkItemBoardItem,
  WorkItemStatus,
} from "@/api/pms/pm/workitem/status";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import {
  createWorkItemStatus,
  deleteWorkItemStatus,
  getWorkItemBoardConfig,
  getWorkItemStatusList,
  updateDefaultWorkItemStatus,
  updateWorkItemBoardConfig,
  updateWorkItemStatusConfig,
  updateWorkItemStatusSort,
} from "@/api/pms/pm/workitem/status";
import {
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from "@/pages-pms/pm/utils/constants";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import {
  getWorkItemStatusTypeName,
  getWorkItemTypeName,
} from "@/pages-pms/pm/utils/format";
import { navigateBackPlus } from "@/utils";

interface BoardWithStatuses extends WorkItemBoardItem {
  statuses: WorkItemStatus[]; // 看板列内状态
}

const props = defineProps<{
  projectId?: number | any;
  type?: number | any;
}>();

definePage({
  style: {
    navigationBarTitleText: "",
    navigationStyle: "custom",
  },
});

const toast = useToast();
const projectId = Number(props.projectId); // 项目编号
const type = Number(props.type || PmsWorkItemType.TASK); // 工作项类型
const tabIndex = ref(0); // 当前配置页签下标
const saving = ref(false); // 保存中
const statusList = ref<WorkItemStatus[]>([]); // 状态列表
const boardList = ref<BoardWithStatuses[]>([]); // 看板列及其状态
const unassignedStatuses = ref<WorkItemStatus[]>([]); // 未放入看板的状态
const defaultStatusId = ref<number>(); // 初始状态编号
const statusVisible = ref(false); // 状态编辑弹窗显示状态
const editingStatusIndex = ref(-1); // 当前编辑的状态下标，-1 表示新增
const statusForm = ref({
  name: "",
  statusType: PmsWorkItemStatusType.PROCESSING as number,
  description: "",
}); // 状态编辑表单
const boardStatusVisible = ref(false); // 看板列关联状态弹窗显示状态
const editingBoard = ref<BoardWithStatuses>(); // 当前关联状态的看板列
const boardStatusForm = ref({ statusIds: [] as number[] }); // 看板列关联状态表单
const deleteVisible = ref(false); // 迁移并删除弹窗显示状态
const deleting = ref(false); // 删除提交中
const deletingStatus = ref<WorkItemStatus>(); // 待删除状态
const deleteForm = ref({ transferStatusId: undefined as number | undefined }); // 删除迁移表单

let statusSortable: { destroy: () => void } | undefined; // 状态列表拖拽实例
let boardSortable: { destroy: () => void } | undefined; // 看板列拖拽实例

const assignableStatuses = computed(() => {
  // 当前看板列可关联的状态：未分配或已在本列
  const assignedIds = new Set(
    boardList.value
      .filter((board) => board !== editingBoard.value)
      .flatMap((board) => board.statuses.map((status) => status.id)),
  );
  return statusList.value.filter((status) => !assignedIds.has(status.id));
});
const transferStatusColumns = computed(() =>
  // 可迁移目标状态选项
  statusList.value
    .filter((status) => status.id !== deletingStatus.value?.id)
    .map((status) => ({ label: status.name, value: status.id })),
);

/** 返回上一页 */
function handleBack() {
  navigateBackPlus();
}

/** 初始化状态与看板列拖拽（仅 H5；按钮排序作为通用兜底保留） */
async function initConfigSortable() {
  statusSortable?.destroy();
  boardSortable?.destroy();
  statusSortable = undefined;
  boardSortable = undefined;
  // #ifdef H5
  const Sortable = (await import("sortablejs")).default;
  const statusEl = document.querySelector(".status-sort-list");
  if (statusEl) {
    statusSortable = Sortable.create(statusEl as HTMLElement, {
      animation: 150,
      onEnd: ({ oldIndex, newIndex }) => {
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex
        ) {
          return;
        }
        const [status] = statusList.value.splice(oldIndex, 1);
        statusList.value.splice(newIndex, 0, status);
      },
    });
  }
  const boardEl = document.querySelector(".board-sort-list");
  if (boardEl) {
    boardSortable = Sortable.create(boardEl as HTMLElement, {
      animation: 150,
      onEnd: ({ oldIndex, newIndex }) => {
        if (
          oldIndex === undefined ||
          newIndex === undefined ||
          oldIndex === newIndex
        ) {
          return;
        }
        const [board] = boardList.value.splice(oldIndex, 1);
        boardList.value.splice(newIndex, 0, board);
      },
    });
  }
  // #endif
}

/** 查询状态列表和看板配置 */
async function getList() {
  statusList.value = await getWorkItemStatusList(projectId, type);
  defaultStatusId.value = statusList.value.find(
    (status) => status.defaultStatus,
  )?.id;
  const config = await getWorkItemBoardConfig(projectId, type);
  const statusMap = new Map(
    statusList.value.map((status) => [status.id, status]),
  );
  boardList.value = config.boards.map((board) => ({
    ...board,
    statuses: board.statusIds
      .map((statusId) => statusMap.get(statusId)!)
      .filter(Boolean),
  }));
  unassignedStatuses.value = config.unassignedStatusIds
    .map((statusId) => statusMap.get(statusId)!)
    .filter(Boolean);
  await nextTick();
  initConfigSortable();
}

/** 添加状态（本地暂存，保存时创建） */
function handleAddStatus() {
  const status: WorkItemStatus = {
    id: -Date.now(),
    projectId,
    workItemType: type,
    name: "",
    statusType: PmsWorkItemStatusType.PROCESSING,
    defaultStatus: false,
    sort: statusList.value.length + 1,
  };
  statusList.value.push(status);
  unassignedStatuses.value.push(status);
  editingStatusIndex.value = statusList.value.length - 1;
  statusForm.value = {
    name: "",
    statusType: status.statusType,
    description: "",
  };
  statusVisible.value = true;
}

/** 编辑状态 */
function handleEditStatus(status: WorkItemStatus) {
  editingStatusIndex.value = statusList.value.indexOf(status);
  statusForm.value = {
    name: status.name,
    statusType: status.statusType,
    description: status.description || "",
  };
  statusVisible.value = true;
}

/** 确认状态编辑 */
function handleConfirmStatus() {
  if (!statusForm.value.name.trim()) {
    toast.warning("请输入状态名称");
    return;
  }
  if (
    statusList.value.some(
      (item, index) =>
        index !== editingStatusIndex.value &&
        item.name === statusForm.value.name.trim(),
    )
  ) {
    toast.warning(`状态名称“${statusForm.value.name}”不能重复`);
    return;
  }
  if (editingStatusIndex.value >= 0) {
    const status = statusList.value[editingStatusIndex.value];
    status.name = statusForm.value.name.trim();
    status.statusType = statusForm.value.statusType;
    status.description = statusForm.value.description || undefined;
  }
  statusVisible.value = false;
}

/** 状态上移/下移 */
function handleMoveStatus(index: number, offset: number) {
  const [status] = statusList.value.splice(index, 1);
  statusList.value.splice(index + offset, 0, status);
}

/** 删除状态：未保存的直接移除，已保存的需要迁移工作项 */
function handleDeleteStatus(status: WorkItemStatus) {
  if (status.id < 0) {
    statusList.value = statusList.value.filter((item) => item.id !== status.id);
    unassignedStatuses.value = unassignedStatuses.value.filter(
      (item) => item.id !== status.id,
    );
    boardList.value.forEach((board) => {
      board.statuses = board.statuses.filter((item) => item.id !== status.id);
    });
    return;
  }
  deletingStatus.value = status;
  deleteForm.value = {
    transferStatusId: statusList.value.find((item) => item.id !== status.id)
      ?.id,
  };
  deleteVisible.value = true;
}

/** 确认迁移并删除状态 */
async function handleConfirmDelete() {
  const status = deletingStatus.value;
  if (!status) {
    return;
  }
  if (!deleteForm.value.transferStatusId) {
    toast.warning("迁移目标状态不能为空");
    return;
  }
  deleting.value = true;
  try {
    await deleteWorkItemStatus(status.id, deleteForm.value.transferStatusId);
    toast.success("状态已删除，工作项迁移完成");
    deleteVisible.value = false;
    await getList();
  } finally {
    deleting.value = false;
  }
}

/** 添加看板列 */
function handleAddBoard() {
  boardList.value.push({
    id: -Date.now(),
    name: "",
    statusIds: [],
    statuses: [],
  });
}

/** 看板列上移/下移 */
function handleMoveBoard(index: number, offset: number) {
  const [board] = boardList.value.splice(index, 1);
  boardList.value.splice(index + offset, 0, board);
}

/** 删除看板列，列内状态移回未放入看板区域 */
function handleDeleteBoard(index: number) {
  unassignedStatuses.value.push(...boardList.value[index].statuses);
  boardList.value.splice(index, 1);
}

/** 打开看板列关联状态弹窗 */
function handleAssignBoardStatuses(board: BoardWithStatuses) {
  editingBoard.value = board;
  boardStatusForm.value = {
    statusIds: board.statuses.map((status) => status.id),
  };
  boardStatusVisible.value = true;
}

/** 确认看板列关联状态 */
function handleConfirmBoardStatuses() {
  const board = editingBoard.value;
  if (!board) {
    return;
  }
  const statusMap = new Map(
    statusList.value.map((status) => [status.id, status]),
  );
  board.statuses = boardStatusForm.value.statusIds
    .map((statusId) => statusMap.get(statusId)!)
    .filter(Boolean);
  boardStatusVisible.value = false;
}

/** 保存状态设置 */
async function handleSubmit() {
  const names = statusList.value.map((status) => status.name.trim());
  const boardNames = boardList.value.map((board) => board.name.trim());
  if (names.some((name) => !name)) {
    toast.warning("状态名称不能为空");
    return;
  }
  if (new Set(names).size !== names.length) {
    toast.warning("状态名称不能重复");
    return;
  }
  if (boardNames.some((name) => !name)) {
    toast.warning("看板列名称不能为空");
    return;
  }
  if (new Set(boardNames).size !== boardNames.length) {
    toast.warning("看板列名称不能重复");
    return;
  }
  if (!defaultStatusId.value) {
    toast.warning("请选择初始状态");
    return;
  }

  saving.value = true;
  try {
    // 1. 创建或更新状态配置
    for (const status of statusList.value) {
      if (status.id < 0) {
        const oldId = status.id;
        status.id = await createWorkItemStatus({
          projectId,
          workItemType: type,
          name: status.name.trim(),
          statusType: status.statusType,
          description: status.description,
          defaultStatus: status.defaultStatus,
          sort: status.sort,
        });
        if (defaultStatusId.value === oldId) {
          defaultStatusId.value = status.id;
        }
      } else {
        await updateWorkItemStatusConfig({
          id: status.id,
          projectId: status.projectId,
          workItemType: status.workItemType,
          name: status.name.trim(),
          statusType: status.statusType,
          description: status.description,
          defaultStatus: status.defaultStatus,
          sort: status.sort,
        });
      }
    }
    // 2. 更新初始状态、显示顺序和看板配置
    await updateDefaultWorkItemStatus(defaultStatusId.value);
    await updateWorkItemStatusSort(statusList.value.map((status) => status.id));
    await updateWorkItemBoardConfig(
      projectId,
      type,
      boardList.value.map((board) => ({
        id: board.id,
        name: board.name.trim(),
        statusIds: board.statuses.map((status) => status.id),
      })),
    );
    toast.success("状态设置已保存");
    uni.$emit("pms:pm:workitem:reload");
    handleBack();
  } finally {
    saving.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});

/** 卸载 */
onUnmounted(() => {
  statusSortable?.destroy();
  boardSortable?.destroy();
});
</script>
