// #ifdef MP
import Sval from 'sval'
// #endif

const FUNCTION_PREFIX = '[[FORM-CREATE-PREFIX-'
const FUNCTION_SUFFIX = '-FORM-CREATE-SUFFIX]]'

// Align with form-create function deserialization for trusted schema from the form designer/backend.
type JsonFunction = ((...args: any[]) => any) & {
  __inject?: boolean
  __json?: string
}

export function parseJson<T = any>(json?: string | T, fallbackOrMode: T | boolean = {} as T, mode?: boolean): T {
  if (!json) {
    return getParseFallback(fallbackOrMode)
  }
  if (typeof json !== 'string') {
    return json
  }
  try {
    const parseMode = typeof fallbackOrMode === 'boolean' ? fallbackOrMode : !!mode
    return JSON.parse(json, (_, value) => parseFn(value, parseMode))
  } catch {
    return getParseFallback(fallbackOrMode)
  }
}

export function parseFn(value: unknown, mode = false) {
  if (typeof value !== 'string' || value.length <= 4) {
    return value
  }
  let fn = value.trim()
  let shouldParse = false
  try {
    if (fn.includes(FUNCTION_SUFFIX) && fn.startsWith(FUNCTION_PREFIX)) {
      fn = fn.replace(FUNCTION_SUFFIX, '').replace(FUNCTION_PREFIX, '')
      shouldParse = true
    } else if (fn.startsWith('$FN:')) {
      fn = fn.slice(4)
      shouldParse = true
    } else if (fn.startsWith('$EXEC:')) {
      fn = fn.slice(6)
      shouldParse = true
    } else if (fn.startsWith('$GLOBAL:')) {
      const name = fn.slice(8)
      const globalFn: JsonFunction = function (this: unknown, ...args: any[]) {
        const callback = args[0]?.api?.getGlobalEvent?.(name)
        return callback ? callback.call(this, ...args) : undefined
      }
      globalFn.__json = value
      globalFn.__inject = true
      return globalFn
    } else if (fn.startsWith('$FNX:')) {
      const parsed = makeFn(`function($inject){\n${fn.slice(5)}\n}`) as JsonFunction
      parsed.__json = value
      parsed.__inject = true
      return parsed
    } else if (!mode && fn.startsWith('function ') && fn !== 'function ') {
      shouldParse = true
    } else if (!mode && fn.startsWith('function(') && fn !== 'function(') {
      shouldParse = true
    }
    if (!shouldParse) {
      return value
    }
    let parsed: JsonFunction
    try {
      parsed = makeFn(fn) as JsonFunction
    } catch {
      parsed = makeFn(`function ${fn}`) as JsonFunction
    }
    parsed.__json = value
    return parsed
  } catch (error) {
    console.error(`[form-create] parse function failed: ${fn}`, error)
    return undefined
  }
}

export function toJson(value: unknown, space?: number) {
  return JSON.stringify(value, (_, val) => {
    if (val && val._isVue === true) {
      return undefined
    }
    if (typeof val !== 'function') {
      return val
    }
    if (val.__json) {
      return val.__json
    }
    const fn = val.__origin || val
    if (fn.__emit) {
      return undefined
    }
    return `${FUNCTION_PREFIX}${String(fn)}${FUNCTION_SUFFIX}`
  }, space)
}

function makeFn(fn: string) {
  let parsed: JsonFunction | undefined
  // #ifdef MP
  parsed = makeInterpretedFn(fn)
  // #endif
  // #ifndef MP
  // eslint-disable-next-line no-new-func -- 兼容可信表单 schema 的函数反序列化
  parsed = (new Function(`return ${fn}`))()
  // #endif
  return parsed as JsonFunction
}

// #ifdef MP
/** 小程序通过解释器恢复设计器函数，规避动态 Function 限制 */
function makeInterpretedFn(fn: string): JsonFunction {
  const interpreter = new Sval({
    ecmaVer: 'latest',
    sandBox: true,
    sourceType: 'script',
  })
  interpreter.run(`exports.default = (${fn})`)
  const parsed = interpreter.exports.default
  if (typeof parsed !== 'function') {
    throw new TypeError('form-create schema function is invalid')
  }
  return parsed as JsonFunction
}
// #endif

function getParseFallback<T>(fallbackOrMode: T | boolean): T {
  return typeof fallbackOrMode === 'boolean' ? {} as T : fallbackOrMode
}
