<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="公众号菜单"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 公众号选择 -->
    <AccountPicker v-model="accountId" @change="handleAccountChange" />

    <!-- 操作按钮 -->
    <view class="bg-white p-24rpx">
      <view class="flex gap-16rpx">
        <wd-button
          v-if="hasAccessByCodes(['mp:menu:save'])"
          class="flex-1" type="success" :loading="saving" @click="handleSave"
        >
          保存发布
        </wd-button>
        <wd-button
          v-if="hasAccessByCodes(['mp:menu:delete'])"
          class="flex-1" type="danger" :loading="clearing" @click="handleClear"
        >
          清空菜单
        </wd-button>
      </view>
    </view>

    <!-- 菜单列表 -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="p-24rpx">
        <view v-if="loading" class="py-60rpx text-center">
          <wd-loading />
        </view>
        <view v-else>
          <view
            v-for="(parent, parentIndex) in menuList"
            :key="parent.id || `parent-${parentIndex}`"
            class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm"
          >
            <view class="mb-16rpx flex items-center justify-between">
              <view class="text-32rpx text-[#333] font-semibold">
                {{ parent.name || '未命名菜单' }}
              </view>
              <wd-button size="small" type="primary" @click="handleEditParent(parent, parentIndex)">
                编辑
              </wd-button>
            </view>
            <view class="mb-16rpx flex gap-12rpx">
              <wd-button class="flex-1" size="small" variant="plain" :disabled="parentIndex === 0" @click="handleMoveParent(parentIndex, -1)">
                上移
              </wd-button>
              <wd-button class="flex-1" size="small" variant="plain" :disabled="parentIndex === menuList.length - 1" @click="handleMoveParent(parentIndex, 1)">
                下移
              </wd-button>
            </view>
            <view v-if="parent.children?.length" class="mb-16rpx">
              <view
                v-for="(child, childIndex) in parent.children"
                :key="child.id || `child-${parentIndex}-${childIndex}`"
                class="mb-12rpx flex items-center justify-between rounded-8rpx bg-[#f8f8f8] p-16rpx"
              >
                <view class="min-w-0 flex-1">
                  <view class="truncate text-28rpx text-[#333]">
                    {{ child.name || '未命名子菜单' }}
                  </view>
                  <view class="text-22rpx text-[#999]">
                    {{ getMenuTypeLabel(child.type) || '未配置动作' }}
                  </view>
                </view>
                <view class="ml-12rpx flex gap-8rpx">
                  <wd-button size="small" variant="plain" :disabled="childIndex === 0" @click="handleMoveChild(parent, childIndex, -1)">
                    上
                  </wd-button>
                  <wd-button size="small" variant="plain" :disabled="childIndex === (parent.children?.length || 0) - 1" @click="handleMoveChild(parent, childIndex, 1)">
                    下
                  </wd-button>
                  <wd-button size="small" type="primary" @click="handleEditChild(child, parentIndex, childIndex)">
                    编辑
                  </wd-button>
                </view>
              </view>
            </view>
            <wd-button
              v-if="(parent.children?.length || 0) < 5"
              size="small"
              variant="plain"
              block
              @click="handleAddChild(parent, parentIndex)"
            >
              新增子菜单
            </wd-button>
          </view>
          <wd-button
            v-if="menuList.length < 3"
            type="primary"
            block
            variant="plain"
            @click="handleAddParent"
          >
            新增一级菜单
          </wd-button>
        </view>
      </view>
    </scroll-view>

    <!-- 菜单编辑弹窗 -->
    <wd-popup v-model="editorVisible" position="bottom" safe-area-inset-bottom>
      <scroll-view scroll-y class="max-h-[80vh] bg-white">
        <view class="p-24rpx">
          <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
            编辑菜单
          </view>
          <wd-form :model="activeMenu">
            <wd-cell-group border>
              <wd-form-item title="菜单名称" title-width="220rpx">
                <wd-input v-model="activeMenu.name" clearable :maxlength="activePosition.childIndex === -1 ? 4 : 7" placeholder="请输入菜单名称" />
              </wd-form-item>
              <template v-if="isLeafMenu">
                <wd-form-item title="菜单标识" title-width="220rpx">
                  <wd-input v-model="activeMenu.menuKey" clearable placeholder="请输入菜单 KEY" />
                </wd-form-item>
                <yd-form-picker
                  v-model="activeMenu.type"
                  label="菜单内容"
                  label-width="220rpx"
                  :columns="menuTypeOptions"
                  placeholder="请选择菜单内容"
                />
                <wd-form-item v-if="activeMenu.type === 'view'" title="跳转链接" title-width="220rpx">
                  <wd-input v-model="activeMenu.url" clearable placeholder="请输入链接" />
                </wd-form-item>
                <template v-if="activeMenu.type === 'miniprogram'">
                  <wd-form-item title="小程序 AppID" title-width="220rpx">
                    <wd-input v-model="activeMenu.miniProgramAppId" clearable placeholder="请输入小程序 AppID" />
                  </wd-form-item>
                  <wd-form-item title="页面路径" title-width="220rpx">
                    <wd-input v-model="activeMenu.miniProgramPagePath" clearable placeholder="请输入小程序页面路径" />
                  </wd-form-item>
                  <wd-form-item title="备用网页" title-width="220rpx">
                    <wd-input v-model="activeMenu.url" clearable placeholder="请输入备用网页" />
                  </wd-form-item>
                </template>
                <template v-if="activeMenu.type === 'article_view_limited'">
                  <wd-cell
                    title="素材库"
                    is-link
                    :value="activeMenu.replyArticles?.length ? '重新选择图文' : '选择图文'"
                    @click="materialPickerVisible = true"
                  />
                  <view v-if="activeMenu.replyArticles?.length" class="px-24rpx py-16rpx">
                    <NewsCard :articles="activeMenu.replyArticles" />
                    <wd-button class="mt-16rpx" type="danger" size="small" variant="plain" block @click="handleDeleteArticles">
                      删除图文
                    </wd-button>
                  </view>
                </template>
                <template v-if="activeMenu.type === 'click' || activeMenu.type === 'scancode_waitmsg'">
                  <yd-form-picker
                    :model-value="activeMenu.reply?.type"
                    label="回复类型"
                    label-width="220rpx"
                    :columns="replyTypeOptions"
                    placeholder="请选择回复类型"
                    @confirm="handleReplyTypeConfirm"
                  />
                  <!-- 文本：直接输入回复内容 -->
                  <wd-form-item v-if="activeMenu.reply?.type === 'text'" title="回复内容" title-width="220rpx">
                    <wd-textarea v-model="activeMenu.reply.content" clearable placeholder="请输入文本内容" />
                  </wd-form-item>
                  <!-- 图片 / 语音 / 视频 / 图文 / 音乐：素材库选择 + 本地上传 -->
                  <template v-if="canPickReplyMaterial">
                    <wd-cell
                      title="素材库"
                      is-link
                      :value="replyMaterialPicked ? '重新选择' : (activeMenu.reply?.type === 'music' ? '选择缩略图' : '选择素材')"
                      @click="materialPickerVisible = true"
                    />
                    <wd-cell
                      v-if="canUploadReplyMaterial"
                      title="本地上传"
                      is-link
                      :value="uploading ? '上传中...' : '从本地选择并上传'"
                      @click="handleUploadReplyMaterial"
                    />
                  </template>
                  <!-- 图片：缩略图预览 -->
                  <view v-if="activeMenu.reply?.type === 'image' && activeMenu.reply?.url" class="px-24rpx py-16rpx">
                    <wd-img :src="activeMenu.reply.url" width="200rpx" height="200rpx" mode="aspectFill" radius="8rpx" />
                  </view>
                  <!-- 语音 / 视频：媒体预览 -->
                  <view v-if="(activeMenu.reply?.type === 'voice' || activeMenu.reply?.type === 'video') && activeMenu.reply?.url" class="px-24rpx py-16rpx">
                    <MediaPreview :type="activeMenu.reply.type" :url="activeMenu.reply.url" />
                  </view>
                  <!-- 图文：图文卡片预览 -->
                  <view v-if="activeMenu.reply?.type === 'news' && activeMenu.reply?.articles?.length" class="px-24rpx py-16rpx">
                    <NewsCard :articles="activeMenu.reply.articles" />
                    <wd-button class="mt-16rpx" type="danger" size="small" variant="plain" block @click="handleDeleteReplyArticles">
                      删除图文
                    </wd-button>
                  </view>
                  <!-- 视频：标题 / 描述 -->
                  <template v-if="activeMenu.reply?.type === 'video'">
                    <wd-form-item title="标题" title-width="220rpx">
                      <wd-input v-model="activeMenu.reply.title" clearable placeholder="请输入标题" />
                    </wd-form-item>
                    <wd-form-item title="描述" title-width="220rpx">
                      <wd-textarea v-model="activeMenu.reply.description" clearable placeholder="请输入描述" />
                    </wd-form-item>
                  </template>
                  <!-- 音乐：缩略图预览 + 标题 / 描述 + 音乐链接 -->
                  <template v-if="activeMenu.reply?.type === 'music'">
                    <view v-if="activeMenu.reply?.thumbMediaUrl" class="px-24rpx py-16rpx">
                      <wd-img :src="activeMenu.reply.thumbMediaUrl" width="200rpx" height="200rpx" mode="aspectFill" radius="8rpx" />
                    </view>
                    <wd-form-item title="标题" title-width="220rpx">
                      <wd-input v-model="activeMenu.reply.title" clearable placeholder="请输入标题" />
                    </wd-form-item>
                    <wd-form-item title="描述" title-width="220rpx">
                      <wd-textarea v-model="activeMenu.reply.description" clearable placeholder="请输入描述" />
                    </wd-form-item>
                    <wd-form-item title="音乐链接" title-width="220rpx">
                      <wd-input v-model="activeMenu.reply.musicUrl" clearable placeholder="请输入音乐链接" />
                    </wd-form-item>
                    <wd-form-item title="高质量链接" title-width="220rpx">
                      <wd-input v-model="activeMenu.reply.hqMusicUrl" clearable placeholder="请输入高质量音乐链接" />
                    </wd-form-item>
                  </template>
                </template>
              </template>
            </wd-cell-group>
          </wd-form>
          <view class="mt-24rpx flex gap-16rpx">
            <wd-button class="flex-1" type="danger" variant="plain" @click="handleDeleteActive">
              删除
            </wd-button>
            <wd-button class="flex-1" type="primary" @click="handleCloseEditor">
              完成
            </wd-button>
          </view>
        </view>
      </scroll-view>
    </wd-popup>

    <!-- 素材选择 -->
    <MaterialPicker
      v-model:visible="materialPickerVisible"
      :account-id="accountId"
      :type="materialPickerType"
      @select="handleMaterialSelect"
    />
  </view>
</template>

<script lang="ts" setup>
import type { MenuReply, MpMenu } from '@/api/mp/menu'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, reactive, ref } from 'vue'
import { deleteMenu, getMenuList, saveMenu } from '@/api/mp/menu'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { handleTree } from '@/utils/tree'
import AccountPicker from '@/pages-mp/account/components/account-picker.vue'
import MediaPreview from '@/pages-mp/components/media-preview.vue'
import NewsCard from '@/pages-mp/components/news-card.vue'
import MaterialPicker from '@/pages-mp/material/components/material-picker.vue'
import { useMaterialUpload } from '@/pages-mp/utils/upload'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const menuTypeOptions = [
  { value: 'view', label: '跳转网页' },
  { value: 'miniprogram', label: '跳转小程序' },
  { value: 'click', label: '点击回复' },
  { value: 'article_view_limited', label: '跳转图文消息' },
  { value: 'scancode_push', label: '扫码直接返回结果' },
  { value: 'scancode_waitmsg', label: '扫码回复' },
  { value: 'pic_sysphoto', label: '系统拍照发图' },
  { value: 'pic_photo_or_album', label: '拍照或者相册' },
  { value: 'pic_weixin', label: '微信相册' },
  { value: 'location_select', label: '选择地理位置' },
]
const replyTypeOptions = [
  { value: 'text', label: '文本' },
  { value: 'image', label: '图片' },
  { value: 'voice', label: '语音' },
  { value: 'video', label: '视频' },
  { value: 'news', label: '图文' },
  { value: 'music', label: '音乐' },
]

/** 获取菜单类型文案 */
function getMenuTypeLabel(type?: string) {
  return menuTypeOptions.find(item => item.value === type)?.label || type || ''
}

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const accountId = ref<number>() // 当前公众号编号
const menuList = ref<MpMenu[]>([]) // 菜单列表
const loading = ref(false) // 加载状态
const saving = ref(false) // 保存状态
const clearing = ref(false) // 清空状态
const editorVisible = ref(false) // 编辑弹窗
const activeMenu = ref<MpMenu>({ reply: {} }) // 当前菜单
const activePosition = reactive({
  parentIndex: -1,
  childIndex: -1,
}) // 当前菜单位置
const materialPickerVisible = ref(false) // 素材选择弹窗
const { uploading, chooseAndUpload } = useMaterialUpload() // 回复素材本地上传
let replyCache: Record<string, MenuReply> = {} // 当前菜单编辑期内按回复类型缓存已填内容，切换类型时保留
let replyCacheMenu: MpMenu | null = null // replyCache 所属的菜单，切换到别的菜单才清空

const isLeafMenu = computed(() => !(activeMenu.value.children && activeMenu.value.children.length > 0))
const canPickReplyMaterial = computed(() => ['image', 'voice', 'video', 'news', 'music'].includes(String(activeMenu.value.reply?.type)))
const canUploadReplyMaterial = computed(() => ['image', 'voice', 'video'].includes(String(activeMenu.value.reply?.type)))
const replyMaterialPicked = computed(() => {
  const reply = activeMenu.value.reply
  if (reply?.type === 'news') {
    return !!reply.articles?.length
  }
  if (reply?.type === 'music') {
    return !!reply.thumbMediaUrl
  }
  return !!reply?.url
})
const materialPickerType = computed(() => {
  if (activeMenu.value.type === 'article_view_limited' || activeMenu.value.reply?.type === 'news') {
    return 'news'
  }
  if (activeMenu.value.reply?.type === 'voice') {
    return 'voice'
  }
  if (activeMenu.value.reply?.type === 'video') {
    return 'video'
  }
  return 'image'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 公众号切换 */
function handleAccountChange(id: number) {
  accountId.value = id
  getList()
}

/** 查询菜单列表 */
async function getList() {
  if (!accountId.value) {
    menuList.value = []
    return
  }
  loading.value = true
  try {
    const data = await getMenuList(accountId.value)
    menuList.value = handleTree((data || []).map(menuToFrontend), 'id')
  } finally {
    loading.value = false
  }
}

/** 后端菜单转前端菜单 */
function menuToFrontend(item: MpMenu): MpMenu {
  return {
    ...item,
    reply: {
      type: item.replyMessageType,
      accountId: item.accountId,
      content: item.replyContent,
      mediaId: item.replyMediaId,
      url: item.replyMediaUrl,
      title: item.replyTitle,
      description: item.replyDescription,
      thumbMediaId: item.replyThumbMediaId,
      thumbMediaUrl: item.replyThumbMediaUrl,
      articles: item.replyArticles,
      musicUrl: item.replyMusicUrl,
      hqMusicUrl: item.replyHqMusicUrl,
    },
  }
}

/** 前端菜单转后端菜单 */
function menuToBackend(menu: MpMenu): MpMenu {
  const reply = menu.reply || {}
  // article_view_limited 的图文存于顶层 replyArticles；click/scancode 回复图文存于 reply.articles
  const replyArticles = menu.type === 'article_view_limited' ? menu.replyArticles : reply.articles
  return {
    ...menu,
    children: undefined,
    reply: undefined,
    replyMessageType: reply.type,
    replyContent: reply.content,
    replyMediaId: reply.mediaId,
    replyMediaUrl: reply.url,
    replyTitle: reply.title,
    replyDescription: reply.description,
    replyThumbMediaId: reply.thumbMediaId,
    replyThumbMediaUrl: reply.thumbMediaUrl,
    replyArticles,
    replyMusicUrl: reply.musicUrl,
    replyHqMusicUrl: reply.hqMusicUrl,
  }
}

/** 校验单个菜单的图文必填，返回错误提示（无错误返回空串） */
function validateMenuArticles(menu: MpMenu): string {
  // 图文跳转：需选择素材库（articleId）并填好图文数组
  if (menu.type === 'article_view_limited') {
    if (!menu.articleId || !menu.replyArticles?.length) {
      return `菜单「${menu.name || '未命名菜单'}」请选择图文素材`
    }
    return ''
  }
  // 点击 / 扫码回复 + 图文回复：需填好图文数组
  if ((menu.type === 'click' || menu.type === 'scancode_waitmsg') && menu.reply?.type === 'news') {
    if (!menu.reply.articles?.length) {
      return `菜单「${menu.name || '未命名菜单'}」请选择图文回复素材`
    }
  }
  return ''
}

/** 保存菜单 */
async function handleSave() {
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  // 图文必填校验，对齐后端 NewsMessageGroup / ViewLimitedButtonGroup，避免提交后 400
  for (const parent of menuList.value) {
    const errorMessages = [validateMenuArticles(parent), ...(parent.children || []).map(validateMenuArticles)]
    const errorMessage = errorMessages.find(Boolean)
    if (errorMessage) {
      toast.show(errorMessage)
      return
    }
  }
  // 保存即真实下发到公众号，二次确认防呆
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要保存并发布菜单吗？',
    })
  } catch {
    return
  }
  const menus = menuList.value.map((item) => {
    const menu = menuToBackend(item)
    if (item.children?.length) {
      menu.children = item.children.map(menuToBackend)
    }
    return menu
  })
  saving.value = true
  try {
    await saveMenu(accountId.value, menus)
    toast.success('发布成功')
    getList()
  } finally {
    saving.value = false
  }
}

/** 清空菜单 */
async function handleClear() {
  if (!accountId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要清空公众号菜单吗？',
    })
  } catch {
    return
  }
  clearing.value = true
  try {
    await deleteMenu(accountId.value)
    toast.success('清空成功')
    menuList.value = []
  } finally {
    clearing.value = false
  }
}

/** 新增一级菜单 */
function handleAddParent() {
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  const menu: MpMenu = {
    name: '菜单名称',
    children: [],
    reply: {
      type: 'text',
      accountId: accountId.value,
    },
  }
  menuList.value.push(menu)
  handleEditParent(menu, menuList.value.length - 1)
}

/** 新增子菜单 */
function handleAddChild(parent: MpMenu, parentIndex: number) {
  parent.children = parent.children || []
  // 不预设 type，由用户主动选择菜单内容，避免空内容直接 400
  const menu: MpMenu = {
    name: '子菜单名称',
    reply: {
      type: 'text',
      accountId: accountId.value,
    },
  }
  parent.children.push(menu)
  handleEditChild(menu, parentIndex, parent.children.length - 1)
}

/** 移动一级菜单 */
function handleMoveParent(index: number, offset: number) {
  moveItem(menuList.value, index, offset)
}

/** 移动子菜单 */
function handleMoveChild(parent: MpMenu, index: number, offset: number) {
  if (!parent.children) {
    return
  }
  moveItem(parent.children, index, offset)
}

/** 移动列表项 */
function moveItem<T>(list: T[], index: number, offset: number) {
  const targetIndex = index + offset
  if (targetIndex < 0 || targetIndex >= list.length) {
    return
  }
  const current = list[index]
  list[index] = list[targetIndex]
  list[targetIndex] = current
}

/** 编辑一级菜单 */
function handleEditParent(menu: MpMenu, parentIndex: number) {
  activeMenu.value = ensureMenu(menu)
  activePosition.parentIndex = parentIndex
  activePosition.childIndex = -1
  editorVisible.value = true
}

/** 编辑子菜单 */
function handleEditChild(menu: MpMenu, parentIndex: number, childIndex: number) {
  activeMenu.value = ensureMenu(menu)
  activePosition.parentIndex = parentIndex
  activePosition.childIndex = childIndex
  editorVisible.value = true
}

/** 补齐菜单默认值 */
function ensureMenu(menu: MpMenu) {
  menu.reply = menu.reply || { type: 'text', accountId: accountId.value }
  menu.children = menu.children || []
  // 回复类型缓存按菜单隔离：切到别的菜单才重置，同一菜单编辑期内（含重入）保留各类型已填内容
  if (replyCacheMenu !== menu) {
    replyCache = {}
    replyCacheMenu = menu
  }
  return menu
}

/** 回复类型选择 */
function handleReplyTypeConfirm(nextType: string) {
  if (!nextType) {
    return
  }
  const current = activeMenu.value.reply || {}
  if (current.type === nextType) {
    return
  }
  // 缓存当前类型已填内容，切回时恢复，避免跨类型来回切丢失数据
  if (current.type) {
    replyCache[current.type] = current
  }
  const cached = replyCache[nextType]
  activeMenu.value.reply = cached || { type: nextType, accountId: accountId.value }
}

/** 图文素材转后端 Article 结构（title/description/picUrl/url） */
function toReplyArticles(articles: any[]) {
  return articles.map(article => ({
    title: article.title,
    description: article.description || article.digest,
    picUrl: article.picUrl || article.thumbUrl,
    url: article.url || article.contentSourceUrl,
  }))
}

/** 选择素材 */
function handleMaterialSelect(item: any) {
  const articles = item.content?.newsItem || item.articles || []
  if (activeMenu.value.type === 'article_view_limited') {
    if (articles.length > 1) {
      toast.show('选择的是多图文，将默认跳转第一篇')
    }
    activeMenu.value.articleId = item.articleId
    activeMenu.value.replyArticles = toReplyArticles(articles)
    return
  }
  activeMenu.value.reply = activeMenu.value.reply || {}
  if (activeMenu.value.reply.type === 'news') {
    activeMenu.value.reply.articles = toReplyArticles(articles)
    return
  }
  // 音乐：选图片素材作为缩略图
  if (activeMenu.value.reply.type === 'music') {
    activeMenu.value.reply.thumbMediaId = item.mediaId || ''
    activeMenu.value.reply.thumbMediaUrl = item.url || ''
    return
  }
  activeMenu.value.reply.mediaId = item.mediaId || ''
  activeMenu.value.reply.url = item.url || ''
  activeMenu.value.reply.title = item.title || item.name || ''
  activeMenu.value.reply.description = item.introduction || item.description || ''
}

/** 本地上传回复素材（临时素材），回填 mediaId / url */
async function handleUploadReplyMaterial() {
  if (uploading.value) {
    return
  }
  const type = activeMenu.value.reply?.type
  if (type !== 'image' && type !== 'voice' && type !== 'video') {
    return
  }
  if (!accountId.value) {
    toast.show('请先选择公众号')
    return
  }
  const material = await chooseAndUpload(type, { accountId: accountId.value, permanent: false })
  if (!material) {
    return
  }
  activeMenu.value.reply = activeMenu.value.reply || {}
  activeMenu.value.reply.mediaId = material.mediaId || ''
  activeMenu.value.reply.url = material.url || ''
  toast.success('上传成功')
}

/** 删除图文跳转已选图文 */
function handleDeleteArticles() {
  activeMenu.value.articleId = undefined
  activeMenu.value.replyArticles = []
}

/** 删除图文回复已选图文 */
function handleDeleteReplyArticles() {
  if (activeMenu.value.reply) {
    activeMenu.value.reply.articles = []
  }
}

/** 关闭编辑弹窗 */
function handleCloseEditor() {
  editorVisible.value = false
}

/** 删除当前菜单 */
async function handleDeleteActive() {
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定删除当前菜单吗？',
    })
  } catch {
    return
  }
  if (activePosition.childIndex >= 0) {
    menuList.value[activePosition.parentIndex].children?.splice(activePosition.childIndex, 1)
  } else if (activePosition.parentIndex >= 0) {
    menuList.value.splice(activePosition.parentIndex, 1)
  }
  editorVisible.value = false
}
</script>
