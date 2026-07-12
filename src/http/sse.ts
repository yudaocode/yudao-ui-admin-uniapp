import { useTokenStore } from '@/store/token'
import { getEnvBaseUrl } from '@/utils'

export interface SseOptions<T = Record<string, any>> {
  data: T
  ctrl: AbortController
  onMessage?: (res: { data: string }) => void | Promise<void>
  onError?: (...args: any[]) => void
  onClose?: (...args: any[]) => void
}

interface ChunkRequestTask extends UniNamespace.RequestTask {
  onChunkReceived: (callback: (res: { data: ArrayBuffer }) => void) => void
}

const SSE_TIMEOUT = 10 * 60 * 1000 // 流式请求最长等待时间

/** 创建 SSE 消息解析器 */
function createSseParser<T>(options: SseOptions<T>) {
  let buffer = ''
  let closed = false

  /** 关闭流 */
  function close() {
    if (closed) {
      return
    }
    closed = true
    options.onClose?.()
  }

  /** 解析流式文本 */
  async function push(text: string) {
    if (closed) {
      return
    }
    buffer += text
    const chunks = buffer.split(/\r?\n\r?\n/)
    buffer = chunks.pop() || ''

    for (const chunk of chunks) {
      const data = chunk
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.replace(/^data:\s?/, ''))
        .join('\n')

      if (!data) {
        continue
      }
      if (data === '[DONE]') {
        close()
        return
      }
      await options.onMessage?.({ data })
    }
  }

  /** 处理流结束时未带空行的最后一帧 */
  async function finish() {
    if (closed || !buffer.trim()) {
      return
    }
    await push('\n\n')
  }

  return {
    push,
    finish,
    close,
    isClosed: () => closed,
  }
}

/** 创建微信小程序 UTF-8 分块解码器 */
function createUtf8ChunkDecoder() {
  let pending = new Uint8Array()

  /** 解码当前分块 */
  function decode(buffer: ArrayBuffer) {
    const current = new Uint8Array(buffer)
    const bytes = new Uint8Array(pending.length + current.length)
    bytes.set(pending)
    bytes.set(current, pending.length)

    let result = ''
    let index = 0
    while (index < bytes.length) {
      const first = bytes[index]
      let length = 1
      let codePoint = first
      if ((first & 0xE0) === 0xC0) {
        length = 2
        codePoint = first & 0x1F
      } else if ((first & 0xF0) === 0xE0) {
        length = 3
        codePoint = first & 0x0F
      } else if ((first & 0xF8) === 0xF0) {
        length = 4
        codePoint = first & 0x07
      } else if (first >= 0x80) {
        result += '\uFFFD'
        index += 1
        continue
      }

      if (index + length > bytes.length) {
        break
      }
      let valid = true
      for (let offset = 1; offset < length; offset += 1) {
        const next = bytes[index + offset]
        if ((next & 0xC0) !== 0x80) {
          valid = false
          break
        }
        codePoint = (codePoint << 6) | (next & 0x3F)
      }
      if (!valid) {
        result += '\uFFFD'
        index += 1
        continue
      }

      result += String.fromCodePoint(codePoint)
      index += length
    }
    pending = bytes.slice(index)
    return result
  }

  /** 刷新流结束时残留的不完整字符 */
  function flush() {
    if (!pending.length) {
      return ''
    }
    pending = new Uint8Array()
    return '\uFFFD'
  }

  return { decode, flush }
}

/** 获取 H5 流式请求基础地址 */
function getSseBaseUrl() {
  // #ifdef H5
  if (JSON.parse(import.meta.env.VITE_APP_PROXY_ENABLE)) {
    return import.meta.env.VITE_APP_PROXY_PREFIX
  }
  // #endif
  return getEnvBaseUrl()
}

// #ifdef MP-WEIXIN
/** 发送微信小程序 SSE POST 请求 */
async function sendMpSsePost<T>(url: string, options: SseOptions<T>) {
  const mpToken = await useTokenStore().tryGetValidToken()
  const mpParser = createSseParser(options)
  const decoder = createUtf8ChunkDecoder()
  let processing = Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    let settled = false
    let aborted = false
    let requestTask: ChunkRequestTask

    /** 主动取消请求 */
    const handleAbort = () => {
      aborted = true
      requestTask?.abort()
    }

    /** 清理主动取消监听 */
    const cleanup = () => options.ctrl.signal.removeEventListener('abort', handleAbort)

    /** 正常结束请求 */
    const close = () => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      try {
        mpParser.close()
      } catch (error) {
        console.error('SSE 关闭回调异常', error)
      }
      resolve()
    }

    /** 请求失败 */
    const fail = (error: Error) => {
      if (settled) {
        return
      }
      settled = true
      aborted = true
      requestTask?.abort()
      cleanup()
      try {
        options.onError?.(error)
      } catch (callbackError) {
        console.error('SSE 错误回调异常', callbackError)
      }
      try {
        mpParser.close()
      } catch (callbackError) {
        console.error('SSE 关闭回调异常', callbackError)
      }
      reject(error)
    }

    requestTask = uni.request({
      url: `${getEnvBaseUrl()}${url}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        ...(mpToken ? { Authorization: `Bearer ${mpToken}` } : {}),
      },
      data: options.data,
      enableChunked: true,
      timeout: SSE_TIMEOUT,
      success: async (res) => {
        try {
          await processing
          const remainingText = decoder.flush()
          if (remainingText) {
            await mpParser.push(remainingText)
          }
          await mpParser.finish()
          if (res.statusCode < 200 || res.statusCode >= 300) {
            fail(new Error(`请求失败：${res.statusCode}`))
            return
          }
          close()
        } catch (error) {
          fail(error instanceof Error ? error : new Error(String(error)))
        }
      },
      fail: (res) => {
        if (aborted) {
          close()
          return
        }
        fail(new Error(res.errMsg || '流式请求失败'))
      },
    }) as ChunkRequestTask

    requestTask.onChunkReceived((res) => {
      const text = decoder.decode(res.data)
      processing = processing
        .then(() => mpParser.push(text))
        .catch((error) => {
          fail(error instanceof Error ? error : new Error(String(error)))
        })
    })

    if (options.ctrl.signal.aborted) {
      handleAbort()
    } else {
      options.ctrl.signal.addEventListener('abort', handleAbort, { once: true })
    }
  })
}
// #endif

// #ifdef H5
/** 发送 H5 SSE POST 请求 */
async function sendH5SsePost<T>(url: string, options: SseOptions<T>) {
  const token = await useTokenStore().tryGetValidToken()
  const parser = createSseParser(options)
  const requestController = new AbortController()
  let timedOut = false
  const handleAbort = () => requestController.abort()
  const timeoutTimer = setTimeout(() => {
    timedOut = true
    requestController.abort()
  }, SSE_TIMEOUT)
  if (options.ctrl.signal.aborted) {
    handleAbort()
  } else {
    options.ctrl.signal.addEventListener('abort', handleAbort, { once: true })
  }
  try {
    const response = await fetch(`${getSseBaseUrl()}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(options.data),
      signal: requestController.signal,
    })

    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`)
    }
    if (!response.body) {
      throw new Error('浏览器不支持流式响应')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      await parser.push(decoder.decode(value, { stream: true }))
      if (parser.isClosed()) {
        return
      }
    }
    await parser.push(decoder.decode())
    await parser.finish()
    parser.close()
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      if (timedOut) {
        const timeoutError = new Error('流式请求超时')
        options.onError?.(timeoutError)
        parser.close()
        throw timeoutError
      }
      parser.close()
      return
    }
    options.onError?.(error)
    parser.close()
    throw error
  } finally {
    clearTimeout(timeoutTimer)
    options.ctrl.signal.removeEventListener('abort', handleAbort)
  }
}
// #endif

/** 发送 SSE POST 请求 */
export function sendSsePost<T = Record<string, any>>(url: string, options: SseOptions<T>) {
  let request = Promise.resolve()

  // #ifdef MP-WEIXIN
  request = sendMpSsePost(url, options)
  // #endif

  // #ifdef H5
  request = sendH5SsePost(url, options)
  // #endif

  // #ifndef H5
  // #ifndef MP-WEIXIN
  const error = new Error('当前端暂不支持 AI 流式生成，请使用 H5 或微信小程序访问')
  options.onError?.(error)
  request = Promise.reject(error)
  // #endif
  // #endif

  return request
}
