<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="知识库" placeholder safe-area-inset-top fixed>
      <template #left>
        <view class="flex items-center gap-24rpx pl-4rpx">
          <wd-icon name="arrow-left" size="38rpx" color="#333" @click="handleBack" />
          <wd-icon
            v-if="hasAccessByCodes(['pms:kb:library:update'])"
            name="menu-fold" size="38rpx" color="#333"
            @click="handleGroupManage"
          />
        </view>
      </template>
    </wd-navbar>

    <!-- 分组页签 -->
    <view v-if="groupList.length > 0" class="bg-white">
      <wd-tabs v-model="tabIndex" slidable="always" @change="handleGroupChange">
        <wd-tab
          v-for="group in groupList"
          :key="group.id"
          :title="`${group.name}(${group.libraryCount ?? 0})`"
        />
      </wd-tabs>
    </view>

    <!-- 搜索组件 -->
    <view class="bg-white px-24rpx pb-16rpx">
      <view @click="searchVisible = true">
        <wd-search :placeholder="searchPlaceholder" hide-cancel disabled />
      </view>
    </view>

    <!-- 知识库列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :refresher-enabled="true"
      empty-view-text="暂无知识库"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="mb-16rpx flex items-start gap-16rpx">
            <view class="h-88rpx w-120rpx flex shrink-0 items-center justify-center overflow-hidden rounded-8rpx bg-[#e6f4ff]">
              <wd-img
                v-if="item.coverUrl"
                :src="item.coverUrl"
                width="120rpx"
                height="88rpx"
                mode="aspectFill"
              />
              <wd-icon v-else name="book" size="44rpx" color="#1677ff" />
            </view>
            <view class="min-w-0 flex-1">
              <view class="flex items-center justify-between gap-12rpx">
                <text class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">{{ item.name }}</text>
                <view class="flex shrink-0 items-center gap-12rpx">
                  <wd-tag :type="item.openStatus ? 'success' : 'default'" plain>
                    {{ item.openStatus ? '公开' : '私有' }}
                  </wd-tag>
                  <wd-icon
                    :name="item.favoriteStatus ? 'star-fill' : 'star'"
                    size="36rpx"
                    :color="item.favoriteStatus ? '#fa8c16' : '#999'"
                    @click.stop="handleFavorite(item)"
                  />
                  <wd-icon name="more-vertical" size="36rpx" color="#666" @click.stop="handleMore(item)" />
                </view>
              </view>
              <view class="mt-8rpx truncate text-24rpx text-[#999]">
                {{ item.description || '暂无简介' }}
              </view>
            </view>
          </view>
          <view class="flex items-center justify-between text-26rpx text-[#666]">
            <text>成员 {{ item.memberCount ?? 0 }} · 文档 {{ item.documentCount ?? 0 }} · 文件 {{ item.fileCount ?? 0 }}</text>
            <text class="shrink-0 text-24rpx text-[#999]">{{ formatDate(item.createTime) }}</text>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab
      v-if="hasAccessByCodes(['pms:kb:library:create'])"
      position="right-bottom"
      type="primary"
      :expandable="false"
      @click="handleAdd"
    />

    <!-- 搜索弹窗 -->
    <wd-popup
      v-model="searchVisible"
      position="top"
      :custom-style="getTopPopupStyle()"
      :modal-style="getTopPopupModalStyle()"
      @close="searchVisible = false"
    >
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">
            知识库名称
          </view>
          <wd-input v-model="queryName" placeholder="请输入知识库名称" clearable />
        </view>
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleQuery">
            搜索
          </wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 更多操作 -->
    <wd-action-sheet
      v-model="actionVisible"
      :actions="actionList"
      @select="handleActionSelect"
    />

    <!-- 移动到分组 -->
    <wd-action-sheet
      v-model="groupVisible"
      :actions="groupActions"
      @select="handleGroupSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { KnowledgeLibrary } from '@/api/pms/kb/library'
import type { KnowledgeGroup } from '@/api/pms/kb/library/group'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { createKnowledgeFavorite, deleteKnowledgeFavorite } from '@/api/pms/kb/interaction/favorite'
import { deleteKnowledgeLibrary, getKnowledgeLibraryPage } from '@/api/pms/kb/library'
import { getKnowledgeGroupList, moveKnowledgeLibraryToGroup } from '@/api/pms/kb/library/group'
import { exitKnowledgeLibrary } from '@/api/pms/kb/library/member'
import { useAccess } from '@/hooks/useAccess'
import { PmsKnowledgeGroupType, PmsKnowledgeObjectType } from '@/pages-pms/kb/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle, navigateBackPlus } from '@/utils'
import { formatDate } from '@/utils/date'
import { useUserStore } from '@/store/user'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前分组页签下标
const list = ref<KnowledgeLibrary[]>([]) // 列表数据
const groupList = ref<KnowledgeGroup[]>([]) // 知识库分组列表
const pagingRef = ref<any>() // 分页组件引用
const queryName = ref<string>() // 搜索关键字
const searchVisible = ref(false) // 搜索弹窗显示状态
const actionVisible = ref(false) // 更多操作弹窗显示状态
const groupVisible = ref(false) // 移动分组弹窗显示状态
const currentItem = ref<KnowledgeLibrary>() // 当前操作的知识库

const currentUserId = computed(() => useUserStore().userInfo.userId) // 当前登录用户编号
const searchPlaceholder = computed(() => queryName.value ? `知识库名称:${queryName.value}` : '搜索知识库名称') // 搜索条件 placeholder
const moveTargetGroupList = computed(() =>
  groupList.value.filter(item => item.type !== PmsKnowledgeGroupType.ALL),
) // 可移动到的分组
const actionList = computed(() => { // 当前知识库的更多操作项
  const item = currentItem.value
  if (!item) {
    return []
  }
  const actions: Array<{ name: string }> = []
  if (item.writeStatus && hasAccessByCodes(['pms:kb:library:update']) && moveTargetGroupList.value.length > 0) {
    actions.push({ name: '移动分组' })
  }
  if (item.adminStatus && hasAccessByCodes(['pms:kb:library:update'])) {
    actions.push({ name: '编辑' })
  }
  if (item.creatorUserId === currentUserId.value && hasAccessByCodes(['pms:kb:library:delete'])) {
    actions.push({ name: '删除' })
  }
  if (item.exitStatus) {
    actions.push({ name: '退出' })
  }
  return actions
})
const groupActions = computed(() => moveTargetGroupList.value.map(item => ({ name: item.name }))) // 移动分组操作项

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 查询知识库分页 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getKnowledgeLibraryPage({
      pageNo,
      pageSize,
      name: queryName.value || undefined,
      groupId: groupList.value[tabIndex.value]?.id,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 查询知识库分组 */
async function getGroupList() {
  groupList.value = await getKnowledgeGroupList()
}

/** 切换分组 */
function handleGroupChange() {
  pagingRef.value?.reload()
}

/** 搜索按钮操作 */
function handleQuery() {
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  queryName.value = undefined
  searchVisible.value = false
  pagingRef.value?.reload()
}

/** 查看知识库详情 */
function handleDetail(item: KnowledgeLibrary) {
  uni.navigateTo({ url: `/pages-pms/kb/library/home/index?libraryId=${item.id}` })
}

/** 新建知识库 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-pms/kb/library/form/index' })
}

/** 打开知识库分组管理 */
function handleGroupManage() {
  uni.navigateTo({ url: '/pages-pms/kb/library/group/index' })
}

/** 关注或取消关注知识库 */
async function handleFavorite(item: KnowledgeLibrary) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认${item.favoriteStatus ? '取消关注' : '关注'}知识库“${item.name}”吗？` })
  } catch {
    return
  }
  if (item.favoriteStatus) {
    await deleteKnowledgeFavorite(PmsKnowledgeObjectType.LIBRARY, item.id)
  } else {
    await createKnowledgeFavorite({ type: PmsKnowledgeObjectType.LIBRARY, entityId: item.id })
  }
  item.favoriteStatus = !item.favoriteStatus
  toast.success(item.favoriteStatus ? '关注成功' : '已取消关注')
}

/** 打开更多操作 */
function handleMore(item: KnowledgeLibrary) {
  currentItem.value = item
  actionVisible.value = true
}

/** 更多操作选择 */
async function handleActionSelect({ item: action }: { item: { name: string } }) {
  const item = currentItem.value
  if (!item) {
    return
  }
  if (action.name === '移动分组') {
    groupVisible.value = true
    return
  }
  if (action.name === '编辑') {
    uni.navigateTo({ url: `/pages-pms/kb/library/form/index?id=${item.id}` })
    return
  }
  try {
    if (action.name === '删除') {
      await dialog.confirm({ title: '提示', msg: `确认删除知识库“${item.name}”吗？` })
      await deleteKnowledgeLibrary(item.id)
      toast.success('删除成功')
    } else if (action.name === '退出') {
      await dialog.confirm({ title: '提示', msg: `确认退出知识库“${item.name}”吗？退出后将无法访问私有内容。` })
      await exitKnowledgeLibrary(item.id)
      toast.success('已退出知识库')
    }
    await Promise.all([getGroupList(), pagingRef.value?.reload()])
  } catch {}
}

/** 移动知识库到分组 */
async function handleGroupSelect({ index }: { index: number }) {
  const item = currentItem.value
  const group = moveTargetGroupList.value[index]
  if (!item || !group) {
    return
  }
  await moveKnowledgeLibraryToGroup(item.id, group.id)
  toast.success('移动成功')
  await Promise.all([getGroupList(), pagingRef.value?.reload()])
}

/** 初始化 */
onMounted(() => {
  getGroupList()
  uni.$on('pms:kb:library:reload', handleReload)
})

/** 重新加载 */
function handleReload() {
  getGroupList()
  pagingRef.value?.reload()
}

/** 卸载 */
onUnload(() => {
  uni.$off('pms:kb:library:reload', handleReload)
})
</script>
