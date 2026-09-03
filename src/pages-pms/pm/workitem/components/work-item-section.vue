<template>
  <view class="h-full flex flex-col">
    <!-- 搜索组件 -->
    <WorkItemSearchForm
      :project-id="projectId"
      :project-type="projectType"
      :type="type"
      :iteration-id="iterationId"
      @search="handleQuery"
      @reset="handleReset"
    />

    <!-- 列表/看板切换（仅单类型且当前范围支持看板） -->
    <view
      v-if="showBoardToggle"
      class="flex justify-end bg-white px-24rpx pb-16rpx"
    >
      <wd-radio-group
        v-model="viewMode"
        type="button"
        @change="handleViewModeChange"
      >
        <wd-radio value="list"> 列表 </wd-radio>
        <wd-radio value="board"> 看板 </wd-radio>
      </wd-radio-group>
    </view>

    <!-- 工作项列表 -->
    <z-paging
      v-if="viewMode === 'list'"
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无事项"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              #{{ item.serialNumber }} {{ item.name }}
            </view>
            <view class="flex shrink-0 items-center gap-12rpx">
              <wd-tag v-if="!type" type="primary" plain>
                {{ getWorkItemTypeName(item.type) }}
              </wd-tag>
              <wd-tag
                v-if="
                  item.lifecycleStatus === PmsWorkItemLifecycleStatus.ARCHIVED
                "
                type="default"
                plain
              >
                已归档
              </wd-tag>
              <wd-tag
                v-if="
                  item.lifecycleStatus === PmsWorkItemLifecycleStatus.RECYCLED
                "
                type="danger"
                plain
              >
                回收站
              </wd-tag>
              <wd-icon
                v-if="editable"
                name="more-vertical"
                size="36rpx"
                color="#666"
                @click.stop="handleMore(item)"
              />
            </view>
          </view>
          <view
            class="mb-12rpx flex flex-wrap items-center gap-16rpx text-28rpx text-[#666]"
          >
            <text>状态：{{ item.statusName || "-" }}</text>
            <text :style="{ color: getPriorityColor(item.priority) }">
              优先级：{{ getPriorityName(item.priority) }}
            </text>
            <text>负责人：{{ item.assigneeUserName || "未分配" }}</text>
          </view>
          <view
            v-if="item.labels?.length"
            class="mb-12rpx flex flex-wrap gap-8rpx"
          >
            <wd-tag
              v-for="label in item.labels"
              :key="label.id"
              :custom-style="getColorTagStyle(label.color)"
            >
              {{ label.name }}
            </wd-tag>
          </view>
          <view
            class="flex items-center justify-between text-28rpx text-[#666]"
          >
            <text
              v-if="projectType === PmsProjectType.AGILE"
              class="min-w-0 flex-1 truncate"
            >
              {{ item.iterationName || "待规划" }}
            </text>
            <text v-else class="flex-1" />
            <text class="shrink-0 text-[#999]">
              进度 {{ item.progress ?? 0 }}% · 截止
              {{ formatDate(item.endTime) || "未设置" }}
            </text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 看板视图 -->
    <scroll-view
      v-if="viewMode === 'board' && showBoardToggle"
      scroll-y
      class="min-h-0 flex-1"
    >
      <scroll-view scroll-x class="whitespace-nowrap">
        <view
          v-if="!boardColumns.length"
          class="inline-block w-full py-80rpx text-center text-28rpx text-[#999]"
        >
          暂无看板数据
        </view>
        <view v-else class="inline-flex items-start gap-16rpx p-24rpx">
          <view
            v-for="column in boardColumns"
            :key="column.id"
            class="w-560rpx shrink-0 rounded-12rpx bg-[#f7f8fa] p-16rpx"
          >
            <!-- 看板列头 -->
            <view class="mb-12rpx flex items-center justify-between">
              <view class="min-w-0 flex-1">
                <text class="text-28rpx text-[#333] font-semibold">{{
                  column.name
                }}</text>
                <view
                  v-if="column.statuses.length > 1"
                  class="text-20rpx text-[#999]"
                >
                  {{ getBoardColumnStatusNames(column) }}
                </view>
              </view>
              <wd-tag type="default" round>
                {{ getBoardColumnItemCount(column) }}
              </wd-tag>
            </view>
            <!-- 合并列按状态拆分投放区 -->
            <view
              v-for="statusGroup in column.statusGroups"
              :key="statusGroup.status.id"
              class="mb-16rpx last:mb-0"
            >
              <view
                v-if="column.statusGroups.length > 1"
                class="mb-8rpx text-22rpx text-[#999]"
              >
                {{ statusGroup.status.name }}
              </view>
              <view
                class="board-drop min-h-100rpx b-2rpx b-[#e0e0e0] rounded-8rpx b-dashed p-8rpx"
                :data-status-id="statusGroup.status.id"
              >
                <view
                  v-for="card in statusGroup.items"
                  :key="card.id"
                  class="mb-12rpx rounded-8rpx bg-white p-16rpx shadow-sm last:mb-0"
                  :data-work-item-id="card.id"
                  @click="handleDetail(card)"
                >
                  <view
                    class="line-clamp-2 text-26rpx text-[#333] font-semibold leading-36rpx"
                  >
                    {{ card.name }}
                  </view>
                  <view v-if="card.endTime" class="mt-8rpx">
                    <wd-tag
                      :type="isWorkItemOverdue(card) ? 'danger' : 'default'"
                      plain
                    >
                      {{ formatDate(card.endTime) }} 截止
                    </wd-tag>
                  </view>
                  <view
                    class="mt-12rpx flex items-center justify-between gap-8rpx"
                  >
                    <text class="text-22rpx text-[#999]"
                      >#{{ card.serialNumber }}</text
                    >
                    <view class="min-w-0 flex items-center gap-12rpx">
                      <text
                        class="text-22rpx"
                        :style="{ color: getPriorityColor(card.priority) }"
                      >
                        {{ getPriorityName(card.priority) }}
                      </text>
                      <text class="text-22rpx text-[#999]">{{
                        card.assigneeUserName || "未分配"
                      }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </scroll-view>

    <!-- 新建按钮 -->
    <wd-fab
      v-if="canCreate"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 新建事项类型选择（全部事项页签） -->
    <wd-action-sheet
      v-model="createVisible"
      :actions="createActions"
      @select="handleCreateSelect"
    />

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="actionVisible"
      :actions="actionList"
      @select="handleActionSelect"
    />

    <!-- 变更状态 -->
    <wd-action-sheet
      v-model="statusVisible"
      :actions="statusActions"
      @select="handleStatusSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WorkItem, WorkItemBoard } from "@/api/pms/pm/workitem";
import type { WorkItemStatus } from "@/api/pms/pm/workitem/status";
import { computed, ref } from "vue";
import dayjs from "dayjs";
import { useDialog } from "@wot-ui/ui/components/wd-dialog";
import { useToast } from "@wot-ui/ui/components/wd-toast";
import {
  archiveWorkItem,
  deleteWorkItem,
  getWorkItemBoard,
  getWorkItemPage,
  recycleWorkItem,
  restoreWorkItem,
  updateWorkItemSort,
  updateWorkItemStatus,
} from "@/api/pms/pm/workitem";
import { getWorkItemStatusList } from "@/api/pms/pm/workitem/status";
import { useAccess } from "@/hooks/useAccess";
import {
  PmsProjectType,
  PmsWorkItemLifecycleStatus,
  PmsWorkItemStatusType,
  PmsWorkItemType,
} from "@/pages-pms/pm/utils/constants";
import { getIntDictOptions } from "@/hooks/useDict";
import { DICT_TYPE } from "@/utils/constants";
import {
  getPriorityColor,
  getPriorityName,
  getWorkItemTypeName,
} from "@/pages-pms/pm/utils/format";
import { formatDate } from "@/utils/date";
import { getAllPageItems } from "@/utils/page";
import WorkItemSearchForm from "./work-item-search-form.vue";
import { getColorTagStyle } from "@/utils/format";

const props = withDefaults(
  defineProps<{
    projectId: number;
    projectType: number;
    type?: number; // 工作项类型；为空表示全部事项
    iterationId?: number; // 所属迭代编号
    editable: boolean; // 是否允许编辑项目业务数据
    initialAssigneeUserId?: number; // 初始负责人筛选（概况「分配给我的」深链）
  }>(),
  {
    type: undefined,
    iterationId: undefined,
    initialAssigneeUserId: undefined,
  },
);
const emit = defineEmits<{ changed: [] }>(); // 事项变化事件，供上层同步统计

const { hasAccessByCodes } = useAccess();
const toast = useToast();
const dialog = useDialog();
const list = ref<WorkItem[]>([]); // 列表数据
const pagingRef = ref<any>(); // 分页组件引用
const queryParams = ref<Record<string, any>>(
  props.initialAssigneeUserId
    ? { assigneeUserIds: [props.initialAssigneeUserId] }
    : {},
); // 查询参数（支持负责人预选）
const createVisible = ref(false); // 新建事项类型选择弹窗显示状态
const actionVisible = ref(false); // 更多操作弹窗显示状态
const statusVisible = ref(false); // 变更状态弹窗显示状态
const currentItem = ref<WorkItem>(); // 当前操作的工作项
const statusOptions = ref<WorkItemStatus[]>([]); // 当前工作项可变更的状态选项

interface BoardStatusGroup {
  status: WorkItemStatus; // 状态
  items: WorkItem[]; // 状态内工作项
}
interface BoardColumn extends WorkItemBoard {
  statusGroups: BoardStatusGroup[]; // 合并列按状态拆分的投放区
}

const viewMode = ref<"list" | "board">("list"); // 展示模式：列表 / 看板
const boardColumns = ref<BoardColumn[]>([]); // 看板列数据
const boardSaving = ref(false); // 看板拖拽保存中
let boardSortables: Array<{ destroy: () => void }> = []; // 看板拖拽实例

const workItemTypeName = computed(() =>
  props.type ? getWorkItemTypeName(props.type) : "事项",
); // 工作项业务名称
const isActiveLifecycle = computed(
  () =>
    (queryParams.value.lifecycleStatus ?? PmsWorkItemLifecycleStatus.ACTIVE) ===
    PmsWorkItemLifecycleStatus.ACTIVE,
); // 是否「当前」数据范围
const canCreate = computed(
  () =>
    props.editable &&
    isActiveLifecycle.value &&
    hasAccessByCodes(["pms:pm:work-item:create"]),
); // 允许新建：可编辑 + 当前范围 + 创建权限
const createActions = computed(() =>
  // 新建事项类型操作项：通用项目只有任务
  getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE)
    .filter(
      (item) =>
        props.projectType === PmsProjectType.AGILE ||
        item.value === PmsWorkItemType.TASK,
    )
    .map((item) => ({ name: `新建${item.label}` })),
);
const actionList = computed(() => {
  // 当前工作项的更多操作项
  const item = currentItem.value;
  if (!item || !props.editable) {
    return [];
  }
  const actions: Array<{ name: string }> = [];
  const canUpdate = hasAccessByCodes(["pms:pm:work-item:update"]);
  if (isActiveLifecycle.value && canUpdate) {
    actions.push({ name: "编辑" }, { name: "变更状态" }, { name: "归档" });
  }
  if (
    item.lifecycleStatus !== PmsWorkItemLifecycleStatus.RECYCLED &&
    canUpdate
  ) {
    actions.push({ name: "移入回收站" });
  }
  if (!isActiveLifecycle.value && canUpdate) {
    actions.push({ name: "恢复" });
  }
  if (
    item.lifecycleStatus === PmsWorkItemLifecycleStatus.RECYCLED &&
    hasAccessByCodes(["pms:pm:work-item:delete"])
  ) {
    actions.push({ name: "彻底删除" });
  }
  return actions;
});
const statusActions = computed(() =>
  statusOptions.value.map((item) => ({ name: item.name })),
); // 变更状态操作项
const showBoardToggle = computed(
  () => Boolean(props.type) && isActiveLifecycle.value,
); // 单类型且「当前」范围才提供看板切换（对齐 PC）
const hasBoardFilter = computed(() =>
  Boolean(
    queryParams.value.name ||
      queryParams.value.statuses?.length ||
      queryParams.value.priorities?.length ||
      queryParams.value.iterationId ||
      queryParams.value.iterationIds?.length ||
      queryParams.value.excludedIterationIds?.length ||
      queryParams.value.assigneeUserIds?.length ||
      queryParams.value.labelIds?.length,
  ),
); // 看板是否正在筛选，筛选结果不允许持久化列内排序

/** 切换列表/看板展示模式 */
function handleViewModeChange() {
  if (viewMode.value === "board") {
    loadBoard();
  }
}

/** 查询看板数据 */
async function loadBoard() {
  if (!props.type) {
    return;
  }
  const keyword = String(queryParams.value.name || "")
    .trim()
    .toLowerCase();
  const data = await getWorkItemBoard({
    ...queryParams.value,
    projectId: props.projectId,
    type: props.type,
    iterationId: props.iterationId,
  });
  const matchKeyword = (item: WorkItem) =>
    !keyword ||
    item.name.toLowerCase().includes(keyword) ||
    String(item.serialNumber).includes(keyword);
  boardColumns.value = data.map((column) => ({
    ...column,
    statusGroups: column.statuses.map((status) => ({
      status,
      items: column.items.filter(
        (item) => item.statusId === status.id && matchKeyword(item),
      ),
    })),
  }));
  await nextTick();
  initBoardSortable();
}

/** 获得看板列包含的状态名称 */
function getBoardColumnStatusNames(column: WorkItemBoard) {
  return column.statuses.map((item) => item.name).join(" · ");
}

/** 获得看板列内工作项数量 */
function getBoardColumnItemCount(column: BoardColumn) {
  return column.statusGroups.reduce(
    (count, group) => count + group.items.length,
    0,
  );
}

/** 判断工作项是否已经逾期 */
function isWorkItemOverdue(item: WorkItem) {
  return (
    item.status !== PmsWorkItemStatusType.COMPLETED &&
    Boolean(item.endTime) &&
    dayjs(item.endTime).valueOf() < Date.now()
  );
}

/** 收集投放区当前工作项编号顺序 */
function collectBoardIds(el: Element) {
  return Array.from(el.querySelectorAll("[data-work-item-id]")).map((node) =>
    Number((node as HTMLElement).dataset.workItemId),
  );
}

/** 初始化看板拖拽（仅 H5；小程序/App 保留列表与操作菜单） */
async function initBoardSortable() {
  boardSortables.forEach((instance) => instance.destroy());
  boardSortables = [];
  // #ifdef H5
  if (!props.editable) {
    return;
  }
  const Sortable = (await import("sortablejs")).default;
  document.querySelectorAll(".board-drop").forEach((el) => {
    boardSortables.push(
      Sortable.create(el as HTMLElement, {
        group: "pms-work-items",
        animation: 150,
        delay: 120,
        disabled: boardSaving.value,
        onEnd: (event) => {
          void handleBoardDragEnd(event);
        },
      }),
    );
  });
  // #endif
}

/** 看板拖拽结束：跨列变更状态，列内持久化顺序 */
async function handleBoardDragEnd(event: {
  item: HTMLElement;
  from: Element;
  to: Element;
  oldIndex?: number;
  newIndex?: number;
}) {
  if (
    boardSaving.value ||
    (event.oldIndex === event.newIndex && event.from === event.to)
  ) {
    return;
  }
  const toStatusId = Number((event.to as HTMLElement).dataset.statusId);
  const workItemId = Number(event.item.dataset.workItemId);
  if (!toStatusId || !workItemId) {
    return;
  }
  boardSaving.value = true;
  try {
    if (event.from !== event.to) {
      // 跨列拖入：先变更状态；未筛选时同步目标列完整顺序
      await updateWorkItemStatus(workItemId, toStatusId);
      toast.success("状态已更新");
    }
    if (!hasBoardFilter.value) {
      await updateWorkItemSort(toStatusId, collectBoardIds(event.to));
    }
    emit("changed");
  } finally {
    await loadBoard();
    boardSaving.value = false;
  }
}

/** 查询工作项分页（有关键词时对齐 PC：拉全量后按标题/编号前端匹配） */
async function queryList(pageNo: number, pageSize: number) {
  const baseParams = {
    ...queryParams.value,
    projectId: props.projectId,
    type: props.type,
    iterationId: props.iterationId,
    rootOnly: true,
    lifecycleStatus:
      queryParams.value.lifecycleStatus ?? PmsWorkItemLifecycleStatus.ACTIVE,
  };
  try {
    const keyword = String(queryParams.value.name || "")
      .trim()
      .toLowerCase();
    if (keyword) {
      const items = await getAllPageItems((page, size) =>
        getWorkItemPage({
          ...baseParams,
          name: undefined,
          pageNo: page,
          pageSize: size,
        }),
      );
      const filtered = items.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          String(item.serialNumber).includes(keyword),
      );
      pagingRef.value?.complete(filtered);
      return;
    }
    const data = await getWorkItemPage({ ...baseParams, pageNo, pageSize });
    pagingRef.value?.completeByTotal(data.list, data.total);
  } catch {
    pagingRef.value?.complete(false);
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Record<string, any>) {
  queryParams.value = { ...data };
  if (viewMode.value === "board") {
    loadBoard();
    return;
  }
  pagingRef.value?.reload();
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({});
}

/** 刷新列表并通知上层 */
function reload() {
  if (viewMode.value === "board") {
    loadBoard();
  } else {
    pagingRef.value?.reload();
  }
  emit("changed");
}

/** 查看工作项详情 */
function handleDetail(item: WorkItem) {
  uni.navigateTo({ url: `/pages-pms/pm/workitem/detail/index?id=${item.id}` });
}

/** 新建工作项 */
function handleAdd() {
  if (props.type) {
    openCreateForm(props.type);
    return;
  }
  createVisible.value = true;
}

/** 新建事项类型选择 */
function handleCreateSelect({ index }: { index: number }) {
  const option = getIntDictOptions(DICT_TYPE.PMS_WORK_ITEM_TYPE).filter(
    (item) =>
      props.projectType === PmsProjectType.AGILE ||
      item.value === PmsWorkItemType.TASK,
  )[index];
  if (option) {
    openCreateForm(option.value);
  }
}

/** 打开新建工作项表单 */
function openCreateForm(type: number) {
  const query = [
    `projectId=${props.projectId}`,
    `projectType=${props.projectType}`,
    `type=${type}`,
    props.iterationId ? `iterationId=${props.iterationId}` : "",
  ]
    .filter(Boolean)
    .join("&");
  uni.navigateTo({ url: `/pages-pms/pm/workitem/form/index?${query}` });
}

/** 打开更多操作 */
function handleMore(item: WorkItem) {
  currentItem.value = item;
  actionVisible.value = true;
}

/** 更多操作选择 */
async function handleActionSelect({
  item: action,
}: {
  item: { name: string };
}) {
  const item = currentItem.value;
  if (!item?.id) {
    return;
  }
  if (action.name === "编辑") {
    uni.navigateTo({ url: `/pages-pms/pm/workitem/form/index?id=${item.id}` });
    return;
  }
  if (action.name === "变更状态") {
    statusOptions.value = await getWorkItemStatusList(
      item.projectId,
      item.type,
    );
    statusVisible.value = true;
    return;
  }
  try {
    if (action.name === "归档") {
      await dialog.confirm({
        title: "提示",
        msg: `确认归档${getWorkItemTypeName(item.type)}“${item.name}”吗？`,
      });
      await archiveWorkItem(item.id);
      toast.success("归档成功");
    } else if (action.name === "移入回收站") {
      await dialog.confirm({
        title: "提示",
        msg: `确认将${getWorkItemTypeName(item.type)}“${item.name}”移入回收站吗？`,
      });
      await recycleWorkItem(item.id);
      toast.success("已移入回收站");
    } else if (action.name === "恢复") {
      await dialog.confirm({
        title: "提示",
        msg: `确认恢复${getWorkItemTypeName(item.type)}“${item.name}”吗？`,
      });
      await restoreWorkItem(item.id);
      toast.success("恢复成功");
    } else if (action.name === "彻底删除") {
      await dialog.confirm({
        title: "提示",
        msg: `确认彻底删除${getWorkItemTypeName(item.type)}“${item.name}”吗？`,
      });
      await deleteWorkItem(item.id);
      toast.success("删除成功");
    }
    reload();
  } catch {}
}

/** 变更状态选择 */
async function handleStatusSelect({ index }: { index: number }) {
  const item = currentItem.value;
  const status = statusOptions.value[index];
  if (!item?.id || !status) {
    return;
  }
  try {
    await updateWorkItemStatus(item.id, status.id);
    toast.success("状态已更新");
    reload();
  } catch {}
}

defineExpose({ reload });

/** 工作项详情页变更后刷新 */
function handleWorkItemReload() {
  pagingRef.value?.reload();
  emit("changed");
}

/** 初始化 */
onMounted(() => {
  uni.$on("pms:pm:workitem:reload", handleWorkItemReload);
});

/** 卸载 */
onUnmounted(() => {
  uni.$off("pms:pm:workitem:reload", handleWorkItemReload);
  boardSortables.forEach((instance) => instance.destroy());
  boardSortables = [];
});
</script>
