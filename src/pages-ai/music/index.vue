<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="AI 音乐生成"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- Tab 切换 -->
    <view class="bg-white">
      <wd-tabs v-model="tabIndex" shrink>
        <wd-tab title="创作" />
        <wd-tab title="我的作品" />
        <wd-tab title="音乐广场" />
      </wd-tabs>
    </view>

    <!-- 创作面板：切换 Tab 时保留表单内容 -->
    <scroll-view v-show="tabIndex === 0" scroll-y class="min-h-0 flex-1">
      <MusicCreatePanel ref="createPanelRef" @submitted="handleSubmitted" />
    </scroll-view>

    <!-- 我的作品 / 音乐广场 -->
    <MusicList
      v-if="tabIndex !== 0"
      :key="tabIndex"
      ref="listRef"
      :square="tabIndex === 2"
      :current-id="playerState.id"
      :playing="playerState.playing"
      @play="handlePlay"
      @detail="openDetail"
      @extend="handleExtend"
      @concat="handleConcat"
      @edit="openEdit"
      @delete="handleDelete"
      @public="handlePublic"
    />

    <!-- 播放器 -->
    <MusicPlayer ref="playerRef" @change="playerState = $event" />

    <!-- 详情、编辑 -->
    <MusicDetailPopup ref="detailRef" @play="handleDetailPlay" />
    <MusicEditPopup ref="editRef" @success="reloadList" />
  </view>
</template>

<script lang="ts" setup>
import type { Music } from '@/api/ai/music'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { concatMusic, deleteMusicMy, updateMyMusic } from '@/api/ai/music'
import { navigateBackPlus } from '@/utils'
import { getMusicTitle } from '@/utils/constants'
import MusicCreatePanel from './components/music-create-panel.vue'
import MusicDetailPopup from './components/music-detail-popup.vue'
import MusicEditPopup from './components/music-edit-popup.vue'
import MusicList from './components/music-list.vue'
import MusicPlayer from './components/music-player.vue'

const props = defineProps<{
  id?: number | any // 深链打开的作品编号
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const dialog = useDialog()
const tabIndex = ref(0) // 当前 Tab：0 创作、1 我的作品、2 音乐广场
const createPanelRef = ref<InstanceType<typeof MusicCreatePanel>>() // 创作面板引用
const listRef = ref<InstanceType<typeof MusicList>>() // 作品列表引用
const playerRef = ref<InstanceType<typeof MusicPlayer>>() // 播放器引用
const detailRef = ref<InstanceType<typeof MusicDetailPopup>>() // 详情弹窗引用
const editRef = ref<InstanceType<typeof MusicEditPopup>>() // 编辑弹窗引用
const playerState = ref<{ id?: number, playing: boolean }>({ playing: false }) // 播放器状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 刷新作品列表 */
function reloadList() {
  listRef.value?.reload()
}

/** 提交成功：切到我的作品，列表重新挂载后从第一页加载 */
function handleSubmitted() {
  tabIndex.value = 1
}

/** 播放 */
function handlePlay(item: Music, list: Music[]) {
  playerRef.value?.play(item, list)
}

/** 详情内播放 */
function handleDetailPlay(item: Music) {
  playerRef.value?.play(item, [item])
}

/** 详情 */
function openDetail(item: Music) {
  detailRef.value?.open(item.id)
}

/** 续写：带入创作面板 */
function handleExtend(item: Music) {
  createPanelRef.value?.setExtendSource(item)
  tabIndex.value = 0
}

/** 合并为完整歌曲 */
async function handleConcat(item: Music) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认将续写作品《${getMusicTitle(item.title)}》与原曲合并为完整歌曲？合并需中转支持 /suno/submit/concat 扩展路径（官方 SunoAPI 插件不支持）。`,
    })
  } catch {
    return
  }
  await concatMusic(item.id)
  toast.success('合并任务已提交')
  reloadList()
}

/** 编辑名称与封面 */
function openEdit(item: Music) {
  editRef.value?.open(item)
}

/** 删除 */
async function handleDelete(item: Music) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认删除作品《${getMusicTitle(item.title)}》？删除后不可恢复。`,
    })
  } catch {
    return
  }
  await deleteMusicMy(item.id)
  toast.success('删除成功')
  if (playerState.value.id === item.id) {
    playerRef.value?.close()
  }
  reloadList()
}

/** 公开 / 取消公开 */
async function handlePublic(item: Music, value: boolean) {
  await updateMyMusic({ id: item.id, publicStatus: value })
  item.publicStatus = value
  toast.success(value ? '已公开到音乐广场' : '已取消公开')
}

/** 初始化：?id= 深链打开详情 */
onMounted(() => {
  if (props.id) {
    detailRef.value?.open(Number(props.id))
  }
})
</script>
