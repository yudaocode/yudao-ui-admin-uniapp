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
          }" class="verify-move-block" @touchstart="start" @touchend="end" @touchmove="move" @mouseup="end"
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
import { computed, getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs, watch } from 'vue'
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
const barArea = computed(() => {
  const query = uni.createSelectorQuery().in(instance.proxy)
  return query.select('.verify-bar-area')
})
const rectData = ref() // 布局数据
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
  proxy.$el.onselectstart = function () {
    return false
  }
})
// 鼠标按下
function start(e) {
  e = e || window.event
  let x = 0
  if (!e.touches) {
    // 兼容PC端
    x = e.clientX
  } else {
    // 兼容移动端
    x = e.touches[0].pageX
  }
  barArea.value.boundingClientRect((rect) => {
    rectData.value = rect
    startLeft.value = Math.floor(x - rect.left)
  }).exec()
  startMoveTime.value = +new Date() // 开始滑动的时间
  if (isEnd.value === false) {
    text.value = ''
    moveBlockBackgroundColor.value = '#337ab7'
    leftBarBorderColor.value = '#337AB7'
    iconColor.value = '#fff'
    e.stopPropagation()
    status.value = true
  }
}
// 鼠标移动
function move(e) {
  e = e || window.event
  if (status.value && isEnd.value === false) {
    let x = 0
    if (!e.touches) {
      // 兼容PC端
      x = e.clientX
    } else {
      // 兼容移动端
      x = e.touches[0].pageX
    }
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
    let moveLeftDistance = Number.parseInt((moveBlockLeft.value || '0').replace('px', ''))
    moveLeftDistance = (moveLeftDistance * 310) / Number.parseInt(setSize.imgWidth)
    const data = {
      captchaType: captchaType.value,
      pointJson: secretKey.value
        ? aesEncrypt(JSON.stringify({ x: moveLeftDistance, y: 5.0 }), secretKey.value)
        : JSON.stringify({ x: moveLeftDistance, y: 5.0 }),
      token: backToken.value,
    }
    checkCaptcha(data).then((res) => {
      if (res.repCode === '0000') {
        moveBlockBackgroundColor.value = '#5cb85c'
        leftBarBorderColor.value = '#5cb85c'
        iconColor.value = '#fff'
        iconClass.value = 'icon-check'
        showRefresh.value = false
        isEnd.value = true
        if (mode.value === 'pop') {
          setTimeout(() => {
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
        setTimeout(() => {
          tipWords.value = ''
          emit('success', { captchaVerification })
        }, 1000)
      } else {
        moveBlockBackgroundColor.value = '#d9534f'
        leftBarBorderColor.value = '#d9534f'
        iconColor.value = '#fff'
        iconClass.value = 'icon-close'
        passFlag.value = false
        setTimeout(() => {
          refresh()
        }, 1000)
        emit('error', proxy)
        tipWords.value = '验证失败'
        setTimeout(() => {
          tipWords.value = ''
        }, 1000)
      }
    })
    status.value = false
  }
}

async function refresh() {
  showRefresh.value = true
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

  await getPictrue()
  setTimeout(() => {
    transitionWidth.value = ''
    transitionLeft.value = ''
    text.value = explain.value
  }, 300)
}

// 请求背景图片和验证图片
async function getPictrue() {
  const data = {
    captchaType: captchaType.value,
  }
  const res = await getCode(data)

  if (res.repCode === '0000') {
    backImgBase.value = res.repData.originalImageBase64
    blockBackImgBase.value = res.repData.jigsawImageBase64
    backToken.value = res.repData.token
    secretKey.value = res.repData.secretKey
  } else {
    tipWords.value = res.repMsg
  }
}
</script>
