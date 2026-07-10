import { getDictLabel } from '@/hooks/useDict'
import { formatMoney, toNumber } from '@/utils/format'
import { isEmptyValue } from '@/utils/is'

export const DEFAULT_VISIBLE_ROWS = 10 // 默认展示行数（折叠态）
export const MAX_VISIBLE_ROWS = 50 // 展开后的最大展示行数，避免渲染超大列表

/** 统计表格列定义 */
export interface StatisticsColumn {
  prop: string
  label: string
  dictType?: string
  type?: 'money' | 'percent'
}

/** 统计图表系列定义（多系列折线 / 柱状） */
export interface StatisticsChartSeries {
  name: string
  prop: string
  type?: 'bar' | 'line'
}

/** 漏斗图数据项 */
export interface StatisticsFunnelItem {
  name: string
  value: number
}

/** 统计图表配置（折线 / 柱状 / 饼图 / 漏斗） */
export interface StatisticsChart {
  type: 'line' | 'bar' | 'pie' | 'funnel'
  categoryProp?: string
  valueProp?: string
  series?: StatisticsChartSeries[]
  money?: boolean
  funnelData?: StatisticsFunnelItem[]
}

/** 统计区块配置（表格列 + 图表 + 数据加载） */
export interface StatisticsSection {
  title: string
  columns?: StatisticsColumn[]
  chart?: StatisticsChart
  load?: (params: Record<string, any>) => Promise<any>
  transform?: (rows: Record<string, any>[]) => Record<string, any>[]
}

/** 统一转换统计结果（数组原样返回，对象包成单元素数组） */
export function normalizeRows(data: any) {
  if (Array.isArray(data)) {
    return data
  }
  if (!data) {
    return []
  }
  return [data]
}

/** 计算环比增长率（百分比，整数；参考值为 0 时返回 0 防除零） */
export function calculateRelativeRate(value?: number, reference?: number) {
  if (!reference) {
    return 0
  }
  return Number(((100 * ((value || 0) - reference)) / reference).toFixed(0))
}

/** 获取图表高度 */
export function getChartHeight(section: StatisticsSection, options: { rank?: boolean } = {}) {
  // 漏斗
  if (options.rank || section.chart?.type === 'funnel') {
    return '480rpx'
  }
  // 饼图
  if (section.chart?.type === 'pie') {
    return '420rpx'
  }
  return '460rpx'
}

/** 格式化字段值（字典/金额/百分比/普通） */
export function formatColumnValue(row: Record<string, any>, column: StatisticsColumn) {
  const value = row[column.prop]
  if (isEmptyValue(value)) {
    return '-'
  }
  if (column.dictType) {
    return getDictLabel(column.dictType, value) || String(value)
  }
  if (column.type === 'money') {
    const amount = Number(value)
    return Number.isNaN(amount) ? String(value) : amount.toFixed(2)
  }
  if (column.type === 'percent') {
    return `${value}%`
  }
  return String(value)
}

/** 格式化未知结构 */
export function formatEntries(row: Record<string, any>) {
  return Object.entries(row)
    .filter(([, value]) => typeof value !== 'object')
    .map(([label, value]) => ({ label, value: isEmptyValue(value) ? '-' : String(value) }))
}

/** 格式化统计金额 */
export function formatStatisticsAmount(value: unknown, prefix = '￥') {
  return `${prefix}${toNumber(value).toFixed(2)}`
}

/** 格式化统计时间标签（去除年份，仅展示月日 / 月份） */
export function formatStatisticsTimeLabel(time?: string) {
  if (!time) {
    return '-'
  }
  const matched = time.match(/(\d{1,2})-(\d{1,2})$/) // 匹配 月-日
  if (matched) {
    return `${matched[1]}-${matched[2]}`
  }
  return time.replace(/^\d{4}-?/, '') || time
}

/** 图表配色 */
export function getChartColors() {
  return ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#faad14', '#f5222d']
}

/** 获取图表类目文案 */
export function getChartCategory(section: StatisticsSection, row: Record<string, any>, prop?: string) {
  if (!prop) {
    return '-'
  }
  const column = section.columns?.find(item => item.prop === prop)
  return formatColumnValue(row, column || { prop, label: prop })
}

/** 构建坐标轴图表（折线 / 柱状 / 排行） */
export function buildAxisOption(section: StatisticsSection, rows: Record<string, any>[], options: { rank?: boolean }) {
  const chart = section.chart!
  const series = chart.series || []
  const displayRows = options.rank ? rows.slice(0, 10).reverse() : rows
  const categories = displayRows.map(row => getChartCategory(section, row, chart.categoryProp))
  return {
    color: getChartColors(),
    tooltip: {
      trigger: 'axis',
      confine: true,
      valueFormatter: (value: any) => chart.money ? formatMoney(value) : String(value ?? '-'),
    },
    legend: {
      top: 0,
      type: 'scroll',
      textStyle: { color: '#666', fontSize: 11 },
    },
    grid: {
      left: options.rank ? 8 : 12,
      right: 12,
      top: 52,
      bottom: options.rank ? 20 : 34,
      containLabel: true,
    },
    xAxis: options.rank
      ? {
          type: 'value',
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        }
      : {
          type: 'category',
          data: categories,
          axisLabel: { color: '#999', fontSize: 10 },
          axisTick: { show: false },
        },
    yAxis: options.rank
      ? {
          type: 'category',
          data: categories,
          axisLabel: { color: '#666', fontSize: 10 },
          axisTick: { show: false },
        }
      : {
          type: 'value',
          axisLabel: { color: '#999', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
        },
    series: series.map(item => ({
      name: item.name,
      type: options.rank ? 'bar' : item.type || chart.type,
      smooth: (item.type || chart.type) === 'line',
      barMaxWidth: 18,
      data: displayRows.map(row => toNumber(row[item.prop])),
    })),
  }
}

/** 构建饼图 */
export function buildPieOption(section: StatisticsSection, rows: Record<string, any>[]) {
  const chart = section.chart!
  const valueProp = chart.valueProp || 'count'
  return {
    color: getChartColors(),
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
      type: 'scroll',
      textStyle: { color: '#666', fontSize: 11 },
    },
    series: [
      {
        name: section.title,
        type: 'pie',
        radius: ['35%', '62%'],
        center: ['50%', '45%'],
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#666',
          fontSize: 10,
        },
        data: rows.map(row => ({
          name: getChartCategory(section, row, chart.categoryProp),
          value: toNumber(row[valueProp]),
        })),
      },
    ],
  }
}

/** 构建漏斗图（通用：传入带标签的数据项；各域自行准备 items） */
export function buildFunnelOption(items: StatisticsFunnelItem[], name = '转化漏斗') {
  return {
    color: getChartColors(),
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}: {c}',
    },
    series: [
      {
        name,
        type: 'funnel',
        left: '8%',
        right: '8%',
        top: 20,
        bottom: 20,
        sort: 'descending',
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          color: '#fff',
          fontSize: 12,
        },
        data: items.map(item => ({ name: item.name, value: toNumber(item.value) })),
      },
    ],
  }
}

/** 获取默认部门编号（统计页按部门过滤用） */
export function getDefaultDeptId(userInfo: Record<string, any> | undefined) {
  const deptId = Number(userInfo?.deptId)
  return deptId > 0 ? deptId : undefined
}
