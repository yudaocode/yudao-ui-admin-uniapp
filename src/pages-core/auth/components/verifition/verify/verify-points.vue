<template>
  <view style="position: relative">
    <view class="verify-img-out">
      <view
        :style="{
          'width': setSize.imgWidth,
          'height': setSize.imgHeight,
          'background-size': `${setSize.imgWidth} ${setSize.imgHeight}`,
          'margin-bottom': `${pSpace}px`,
        }" class="verify-img-panel"
      >
        <view v-show="showRefresh" class="verify-refresh" style="z-index: 3" @click="refresh">
          <i class="iconfont icon-refresh" />
        </view>
        <img
          id="image" ref="canvas" :src="`data:image/png;base64,${pointBackImgBase}`"
          alt="" style="display: block; width: 100%; height: 100%"
          @click="bindingClick ? canvasClick($event) : undefined"
        >

        <view
          v-for="(tempPoint, index) in tempPoints" :key="index" :style="{
            'background-color': '#1abd6c',
            'color': '#fff',
            'z-index': 9999,
            'width': '20px',
            'height': '20px',
            'text-align': 'center',
            'line-height': '20px',
            'border-radius': '50%',
            'position': 'absolute',
            'top': `${parseInt(tempPoint.y - 10)}px`,
            'left': `${parseInt(tempPoint.x - 10)}px`,
          }" class="point-area"
        >
          {{ index + 1 }}
        </view>
      </view>
    </view>
    <!-- 'height': this.barSize.height, -->
    <view
      :style="{
        'width': setSize.imgWidth,
        'color': barAreaColor,
        'border-color': barAreaBorderColor,
        'line-height': barSize.height,
      }" class="verify-bar-area"
    >
      <span class="verify-msg">{{ text }}</span>
    </view>
  </view>
</template>

<script setup type="text/babel" name="VerifyPoints">
import { getCurrentInstance, nextTick, onMounted, reactive, ref, toRefs } from 'vue'
import { checkCaptcha, getCode } from '@/api/login'
/**
 * VerifyPoints
 * @description 点选
 */
import { aesEncrypt } from './../utils/ase'

const props = defineProps({
  // 弹出式pop，固定fixed
  mode: {
    type: String,
    default: 'fixed',
  },
  captchaType: {
    type: String,
  },
  // 间隔
  pSpace: {
    type: Number,
    default: 5,
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
  barSize: {
    type: Object,
    default() {
      return {
        width: '310px',
        height: '40px',
      }
    },
  },
})

const emit = defineEmits(['error', 'ready', 'success'])
const { mode, captchaType } = toRefs(props)
const { proxy } = getCurrentInstance()
const secretKey = ref('') // 后端返回的ase加密秘钥
const checkNum = ref(3) // 默认需要点击的字数
const fontPos = reactive([]) // 选中的坐标信息
const checkPosArr = reactive([]) // 用户点击的坐标
const num = ref(1) // 点击的记数
const pointBackImgBase = ref('') // 后端获取到的背景图片
const poinTextList = reactive([]) // 后端返回的点击字体顺序
const backToken = ref('') // 后端返回的token值
const setSize = reactive({
  imgHeight: 0,
  imgWidth: 0,
  barHeight: 0,
  barWidth: 0,
})
const tempPoints = reactive([])
const text = ref('')
const barAreaColor = ref(undefined)
const barAreaBorderColor = ref(undefined)
const showRefresh = ref(true)
const bindingClick = ref(true)
const imgLeft = ref('')
const imgTop = ref('')

function init() {
  // 加载页面
  fontPos.splice(0, fontPos.length)
  checkPosArr.splice(0, checkPosArr.length)
  num.value = 1
  getPictrue()
  nextTick(() => {
    setSize.imgHeight = props.imgSize.height
    setSize.imgWidth = props.imgSize.width
    setSize.barHeight = props.barSize.height
    setSize.barWidth = props.barSize.width
    emit('ready', proxy)
  })
}
onMounted(() => {
  // 禁止拖拽
  init()
  proxy.$el.onselectstart = function () {
    return false
  }
})
const canvas = ref(null)
const instance = getCurrentInstance()
function canvasClick(e) {
  const query = uni.createSelectorQuery().in(instance.proxy)
  query.select('#image').boundingClientRect((rect) => {
    imgLeft.value = Math.ceil(rect.left)
    imgTop.value = Math.ceil(rect.top)

    checkPosArr.push(getMousePos(canvas, e))
    if (num.value === checkNum.value) {
      num.value = createPoint(getMousePos(canvas, e))
      // 按比例转换坐标值
      const arr = pointTransfrom(checkPosArr, setSize)
      checkPosArr.length = 0
      checkPosArr.push(...arr)
      // 等创建坐标执行完
      setTimeout(() => {
        // var flag = this.comparePos(this.fontPos, this.checkPosArr);
        // 发送后端请求
        const captchaVerification = secretKey.value
          ? aesEncrypt(`${backToken.value}---${JSON.stringify(checkPosArr)}`, secretKey.value)
          : `${backToken.value}---${JSON.stringify(checkPosArr)}`
        const data = {
          captchaType: captchaType.value,
          pointJson: secretKey.value
            ? aesEncrypt(JSON.stringify(checkPosArr), secretKey.value)
            : JSON.stringify(checkPosArr),
          token: backToken.value,
        }
        checkCaptcha(data).then((res) => {
          if (res.repCode === '0000') {
            barAreaColor.value = '#4cae4c'
            barAreaBorderColor.value = '#5cb85c'
            text.value = '验证成功'
            bindingClick.value = false
            if (mode.value === 'pop') {
              setTimeout(() => {
                proxy.$parent.clickShow = false
                refresh()
              }, 1500)
            }
            emit('success', { captchaVerification })
          } else {
            emit('error', proxy)
            barAreaColor.value = '#d9534f'
            barAreaBorderColor.value = '#d9534f'
            text.value = '验证失败'
            setTimeout(() => {
              refresh()
            }, 700)
          }
        })
      }, 400)
    }
    if (num.value < checkNum.value) {
      num.value = createPoint(getMousePos(canvas, e))
    }
  }).exec()
}
// 获取坐标,H5用offsetX,Y,小程序用clientX,Y,pageX,Y,x,y
function getMousePos(obj, e) {
  const x = e?.offsetX ? e.offsetX : Math.ceil(e?.detail.clientX || e?.detail.pageX || e?.detail.x || 0) - imgLeft.value
  const y = e?.offsetY ? e.offsetY : Math.ceil(e?.detail.clientY || e?.detail.pageY || e?.detail.y || 0) - imgTop.value
  return { x, y }
}
// 创建坐标点
function createPoint(pos) {
  tempPoints.push(Object.assign({}, pos))
  return num.value + 1
}
async function refresh() {
  tempPoints.splice(0, tempPoints.length)
  barAreaColor.value = '#000'
  barAreaBorderColor.value = '#ddd'
  bindingClick.value = true
  fontPos.splice(0, fontPos.length)
  checkPosArr.splice(0, checkPosArr.length)
  num.value = 1
  await getPictrue()
  showRefresh.value = true
}

// 请求背景图片和验证图片
async function getPictrue() {
  const data = {
    captchaType: captchaType.value,
  }
  const res = await getCode(data)
  if (res.repCode === '0000') {
    pointBackImgBase.value = res.repData.originalImageBase64
    backToken.value = res.repData.token
    secretKey.value = res.repData.secretKey
    poinTextList.value = res.repData.wordList
    text.value = `请依次点击` + `【${poinTextList.value.join(',')}】`
  } else {
    text.value = res.repMsg
  }
}
// 坐标转换函数
function pointTransfrom(pointArr, imgSize) {
  const newPointArr = pointArr.map((p) => {
    const x = Math.round((310 * p.x) / Number.parseInt(imgSize.imgWidth))
    const y = Math.round((155 * p.y) / Number.parseInt(imgSize.imgHeight))
    return { x, y }
  })
  return newPointArr
}
</script>
