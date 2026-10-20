<template>
  <view style="position: relative">
    <view v-if="type === '2'" :style="{ height: `${parseInt(setSize.imgHeight) + pSpace}px` }" class="verify-img-out">
      <view :style="{ width: setSize.imgWidth, height: setSize.imgHeight }" class="verify-img-panel">
        <img :src="`data:image/png;base64,${backImgBase}`" alt="" style="display: block; width: 100%; height: 100%">
        <view v-show="showRefresh" class="verify-refresh" @click="refresh">
          <view class="iconfont icon-refresh" />
        </view>
        <transition name="tips">
          <text v-if="tipWords" :class="passFlag ? 'suc-bg' : 'err-bg'" class="verify-tips">
            {{ tipWords }}
          </text>
        </transition>
      </view>
    </view>
    <!-- 公共部分 -->
    <view
      :style="{ 'width': setSize.imgWidth, 'height': barSize.height, 'line-height': barSize.height }"
      class="verify-bar-area"
    >
      <text class="verify-msg">{{ text }}</text>
      <view
        :style="{
          'width': leftBarWidth !== undefined ? leftBarWidth : barSize.height,
          'height': barSize.height,
          'border-color': leftBarBorderColor,
          'transaction': transitionWidth,
        }" class="verify-left-bar"
      >
        <text class="verify-msg">{{ finishText }}</text>
        <view
          v-if="type === '2'" :style="{
            'width': barSize.height,
            'height': barSize.height,
            'background-color': moveBlockBackgroundColor,
            'left': moveBlockLeft,
            'transition': transitionLeft,
          }" class="verify-move-block" @touchstart="start" @touchend="end" @touchmove="move" @touchcancel="cancel" @mouseup="end"
        >
          <view class="verify-icon iconfont" :class="[iconClass]" :style="{ color: iconColor }" />
          <view
            v-if="type === '2'" :style="{
              'width': `${Math.floor((parseInt(setSize.imgWidth) * 47) / 310)}px`,
              'height': setSize.imgHeight,
              'top': `-${parseInt(setSize.imgHeight) + pSpace}px`,
              'background-size': `${setSize.imgWidth} ${setSize.imgHeight}`,
            }" class="verify-sub-block"
          >
            <img
              :src="`data:image/png;base64,${blockBackImgBase}`" alt=""
              style="display: block; width: 100%; height: 100%; -webkit-user-drag: none"
            >
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup name="VerifySlide">
import { getCurrentInstance, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { checkCaptcha, getCode } from '@/api/login'
/**
 * VerifySlide
 * @description 滑块
 */
import { aesEncrypt } from './../utils/ase'

const props = defineProps({
  captchaType: {
    type: String,
  },
  type: {
    type: String,
    default: '1',
  },
  // 弹出式pop，固定fixed
  mode: {
    type: String,
    default: 'fixed',
  },
  pSpace: {
    type: Number,
    default: 5,
  },
  explain: {
    type: String,
    default: '',
  },
  imgSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '155px',
      }
    },
  },
  blockSize: {
    type: Object,
    default() {
      return {
        width: '50px',
        height: '50px',
      }
    },
  },
  barSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '30px',
      }
    },
  },
})

// 父级传递来的函数，用于回调
const emit = defineEmits(['success', 'error', 'ready'])

// const { t } = useI18n()
const { mode, captchaType, type, blockSize, explain } = toRefs(props)
const { proxy } = getCurrentInstance()
const secretKey = ref('') // 后端返回的ase加密秘钥
const passFlag = ref('') // 是否通过的标识
const backImgBase = ref('') // 验证码背景图片
const blockBackImgBase = ref('') // 验证滑块的背景图片
const backToken = ref('') // 后端返回的唯一token值
const startMoveTime = ref('') // 移动开始的时间
const endMovetime = ref('') // 移动结束的时间
const tipWords = ref('')
const text = ref('')
const finishText = ref('')
const setSize = reactive({
  imgHeight: 0,
  imgWidth: 0,
  barHeight: 0,
  barWidth: 0,
})
const moveBlockLeft = ref(0)
const leftBarWidth = ref(0)
// 移动中样式
const moveBlockBackgroundColor = ref(undefined)
const leftBarBorderColor = ref('#ddd')
const iconColor = ref(undefined)
const iconClass = ref('icon-right')
const status = ref(false) // 鼠标状态
const isEnd = ref(false) // 是够验证完成
const showRefresh = ref(true)
const transitionLeft = ref('')
const transitionWidth = ref('')
const startLeft = ref(0)
const instance = getCurrentInstance()
const rectData = ref() // 布局数据
const checking = ref(false) // 校验中，等待结果期间禁止再次拖动
const refreshing = ref(false) // 获取验证码中，避免重复请求
const timers = new Set() // 延时任务，卸载时统一清理
let unmounted = false
/** 组件存活时才执行的延时任务 */
function setTimer(fn, delay) {
  if (unmounted) {
    return
  }
  const timer = setTimeout(() => {
    timers.delete(timer)
    fn()
  }, delay)
  timers.add(timer)
}
function init() {
  if (explain.value === '') {
    text.value = '向右滑动完成验证'
  } else {
    text.value = explain.value
  }
  getPictrue()
  nextTick(() => {
    // let { imgHeight, imgWidth, barHeight, barWidth } = props.value.imgSize
    setSize.imgHeight = props.imgSize.height
    setSize.imgWidth = props.imgSize.width
    setSize.barHeight = props.barSize.height
    setSize.barWidth = props.barSize.width
    emit('ready', proxy)
  })
}
watch(type, () => {
  init()
})
onMounted(() => {
  // 禁止拖拽
  init()
  if (!proxy?.$el) {
    return
  }
  proxy.$el.onselectstart = function () {
    return false
  }
})
onBeforeUnmount(() => {
  unmounted = true
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
})
function getPointerX(e) {
  const touch = e?.touches?.[0] || e?.changedTouches?.[0]
  if (touch) {
    return touch.pageX
  }
  return e?.clientX || 0
}
// 鼠标按下
function start(e) {
  if (isEnd.value || checking.value || refreshing.value) {
    return
  }
  // 上次获取验证码失败时没有有效 token，按下即重新获取，不拖动旧图
  if (!backToken.value) {
    refresh()
    return
  }
  const x = getPointerX(e)
  rectData.value = undefined
  // App 端 exec 会把查询队列里的组件改写为 nodeId，复用同一个 SelectorQuery 再次 exec 会抛错，导致失败后无法再拖动；每次按下重新创建
  uni.createSelectorQuery().in(instance.proxy).select('.verify-bar-area').boundingClientRect((rect) => {
    if (!rect) {
      return
    }
    rectData.value = rect
    startLeft.value = Math.floor(x - rect.left)
  }).exec()
  startMoveTime.value = +new Date() // 开始滑动的时间
  text.value = ''
  moveBlockBackgroundColor.value = '#337ab7'
  leftBarBorderColor.value = '#337AB7'
  iconColor.value = '#fff'
  e?.stopPropagation?.()
  status.value = true
}
// 鼠标移动
function move(e) {
  if (status.value && isEnd.value === false) {
    const x = getPointerX(e)
    if (rectData.value) {
      const bar_area_left = Math.ceil(rectData.value.left)
      const barArea_offsetWidth = Math.ceil(rectData.value.width)
      let move_block_left = x - bar_area_left // 小方块相对于父元素的left值
      if (move_block_left
        >= barArea_offsetWidth - Number.parseInt(Number.parseInt(blockSize.value.width) / 2) - 2
      ) {
        move_block_left
          = barArea_offsetWidth - Number.parseInt(Number.parseInt(blockSize.value.width) / 2) - 2
      }
      if (move_block_left <= 0) {
        move_block_left = Number.parseInt(Number.parseInt(blockSize.value.width) / 2)
      }
      // 拖动后小方块的left值
      moveBlockLeft.value = `${move_block_left - Number.parseInt(Number.parseInt(blockSize.value.width) / 2)
      }px`
      leftBarWidth.value = `${move_block_left - Number.parseInt(Number.parseInt(blockSize.value.width) / 2)
      }px`
    }
  }
}

// 鼠标松开
function end() {
  endMovetime.value = +new Date()
  // 判断是否重合
  if (status.value && isEnd.value === false) {
    status.value = false
    // 未取到滑动条布局或没有有效验证码时，直接复位，不提交校验
    if (!rectData.value || !backToken.value) {
      resetBlock()
      return
    }
    let moveLeftDistance = Number.parseInt((moveBlockLeft.value || '0').replace('px', ''))
    moveLeftDistance = (moveLeftDistance * 310) / Number.parseInt(setSize.imgWidth)
    const data = {
      captchaType: captchaType.value,
      pointJson: secretKey.value
        ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey.value)
        : JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
      token: backToken.value,
    }
    checking.value = true
    checkCaptcha(data).then((res) => {
      if (res.repCode === '0000') {
        checking.value = false
        moveBlockBackgroundColor.value = '#5cb85c'
        leftBarBorderColor.value = '#5cb85c'
        iconColor.value = '#fff'
        iconClass.value = 'icon-check'
        showRefresh.value = false
        isEnd.value = true
        if (mode.value === 'pop') {
          setTimer(() => {
            proxy.$parent.clickShow = false
            refresh()
          }, 1500)
        }
        passFlag.value = true
        tipWords.value = `${((endMovetime.value - startMoveTime.value) / 1000).toFixed(2)}s 验证成功`
        const captchaVerification = secretKey.value
          ? aesEncrypt(
              `${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5.0 })}`,
              secretKey.value,
            )
          : `${backToken.value}---${JSON.stringify({ x: moveLeftDistance, y: 5.0 })}`
        setTimer(() => {
          tipWords.value = ''
          emit('success', { captchaVerification })
        }, 1000)
      } else {
        handleCheckFail()
      }
    }).catch(handleCheckFail) // 请求异常或响应结构异常（如 res 为空）都按失败换图，避免 checking 卡住
  }
}

/** 校验失败或校验请求异常：提示后换一张验证码，允许重新拖动 */
function handleCheckFail() {
  moveBlockBackgroundColor.value = '#d9534f'
  leftBarBorderColor.value = '#d9534f'
  iconColor.value = '#fff'
  iconClass.value = 'icon-close'
  passFlag.value = false
  setTimer(() => {
    checking.value = false
    refresh()
  }, 1000)
  emit('error', proxy)
  tipWords.value = '验证失败'
  setTimer(() => {
    tipWords.value = ''
  }, 1000)
}

/** 触摸被系统打断（touchcancel）时不提交校验，滑块复位后可重新拖动 */
function cancel() {
  if (status.value) {
    resetBlock()
  }
}

async function refresh() {
  // 校验中或获取验证码中不重复刷新
  if (checking.value || refreshing.value) {
    return
  }
  showRefresh.value = true
  resetBlock()
  await getPictrue()
}

/** 滑块复位到起点 */
function resetBlock() {
  status.value = false
  finishText.value = ''

  transitionLeft.value = 'left .3s'
  moveBlockLeft.value = 0

  leftBarWidth.value = 0
  transitionWidth.value = 'width .3s'

  leftBarBorderColor.value = '#ddd'
  moveBlockBackgroundColor.value = '#fff'
  iconColor.value = '#000'
  iconClass.value = 'icon-right'
  isEnd.value = false
  setTimer(() => {
    transitionWidth.value = ''
    transitionLeft.value = ''
    text.value = explain.value || '向右滑动完成验证'
  }, 300)
}

// 请求背景图片和验证图片
async function getPictrue() {
  const data = {
    captchaType: captchaType.value,
  }
  refreshing.value = true
  // 获取期间旧 token 作废；失败时保持为空，避免再次拖动提交旧验证码
  backToken.value = ''
  secretKey.value = ''
  try {
    const res = await getCode(data)

    if (res.repCode === '0000') {
      backImgBase.value = res.repData.originalImageBase64
      blockBackImgBase.value = res.repData.jigsawImageBase64
      backToken.value = res.repData.token
      secretKey.value = res.repData.secretKey
      tipWords.value = ''
    } else {
      tipWords.value = res.repMsg
    }
  } catch {
    // 请求层已提示错误；保留刷新按钮，点击刷新或再次拖动即可重试
  } finally {
    refreshing.value = false
  }
}
</script>
