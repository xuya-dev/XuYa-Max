<!--
  缓存监控（Redis 信息 + 图表）
  参考工作台（dashboard）设计风格：顶部统计卡片 + 信息面板 + 图表区
-->
<template>
  <div class="cache-page">
    <!-- 顶部统计卡片 -->
    <ElRow :gutter="20" class="flex">
      <ElCol v-for="(item, index) in statCards" :key="index" :sm="12" :md="6" :lg="6">
        <div class="xuya-card relative flex flex-col justify-center h-35 px-5 mb-5 max-sm:mb-4">
          <span class="text-g-700 text-sm">{{ item.label }}</span>
          <span class="text-[26px] font-medium mt-2 truncate">{{ item.value }}</span>
          <span v-if="item.sub" class="text-xs text-g-600 mt-1">{{ item.sub }}</span>
          <div class="absolute top-0 bottom-0 right-5 m-auto size-12.5 rounded-xl flex-cc" :style="{ background: item.color + '1a' }">
            <XuyaSvgIcon :icon="item.icon" class="text-xl" :style="{ color: item.color }" />
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 基本信息（扩充字段，分三栏） -->
    <div class="xuya-card p-5 mb-5">
      <h3 class="text-base font-medium text-g-800 mb-4">基本信息</h3>
      <div class="grid grid-cols-3 gap-x-6 gap-y-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div v-for="item in baseInfoList" :key="item.label" class="flex-cb py-1.5 border-b border-g-200">
          <span class="flex-c gap-2 text-sm text-g-600">
            <XuyaSvgIcon :icon="item.icon" class="text-g-500" />
            {{ item.label }}
          </span>
          <span class="text-sm font-medium text-g-800 text-right max-w-[60%] truncate" :title="String(item.value)">{{ item.value }}</span>
        </div>
      </div>
    </div>

    <!-- 命令统计（主图表，左侧）+ 内存使用（右侧） -->
    <ElRow :gutter="20">
      <ElCol :sm="24" :md="24" :lg="16">
        <div class="xuya-card p-5 mb-5 h-full flex flex-col">
          <h3 class="text-base font-medium text-g-800 mb-4">命令统计</h3>
          <div ref="commandChartRef" class="chart-box flex-1"></div>
        </div>
      </ElCol>
      <ElCol :sm="24" :md="24" :lg="8">
        <div class="xuya-card p-5 mb-5 h-full flex flex-col">
          <h3 class="text-base font-medium text-g-800 mb-4">内存使用</h3>
          <div ref="memoryChartRef" class="chart-box flex-1"></div>
        </div>
      </ElCol>
    </ElRow>
  </div>
</template>
<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import * as echarts from 'echarts'
  import { getCache } from '@/api/monitor/cache'
  import { useSettingStore } from '@/store/modules/setting'
  import modal from '@/plugins/modal'
  defineOptions({ name: 'Cache' })

  const cache = ref<any>(null)
  const commandChartRef = ref<HTMLElement>()
  const memoryChartRef = ref<HTMLElement>()
  let commandChart: echarts.ECharts | null = null
  let memoryChart: echarts.ECharts | null = null
  const settingStore = useSettingStore()
  const themeColor = computed(() => settingStore.systemThemeColor)

  /** 安全读取 info 字段 */
  const info = (key: string) => cache.value?.info?.[key]

  /** 计算 Key 命中率（命中 / (命中+未命中)） */
  const hitRate = computed(() => {
    const hits = Number(info('keyspace_hits')) || 0
    const misses = Number(info('keyspace_misses')) || 0
    const total = hits + misses
    if (total === 0) return '0%'
    return ((hits / total) * 100).toFixed(2) + '%'
  })

  /** 顶部统计卡片（Redis 核心指标） */
  const statCards = computed(() => [
    {
      label: 'Redis 版本',
      value: info('redis_version') || '-',
      sub: info('redis_mode') === 'standalone' ? '单机模式' : '集群模式',
      icon: 'ri:database-2-line',
      color: '#377dff'
    },
    {
      label: '客户端连接数',
      value: info('connected_clients') ?? 0,
      sub: `最大连接数 ${info('maxclients') ?? '-'}`,
      icon: 'ri:link',
      color: '#13DEB9'
    },
    {
      label: '内存使用',
      value: info('used_memory_human') || '-',
      sub: `峰值 ${info('used_memory_peak_human') || '-'}`,
      icon: 'ri:cpu-line',
      color: '#ff6b6b'
    },
    {
      label: 'Key 总数',
      value: cache.value?.dbSize ?? 0,
      sub: `命中率 ${hitRate.value}`,
      icon: 'ri:key-2-line',
      color: '#ffb100'
    }
  ])

  /** 基本信息列表（扩充字段） */
  const baseInfoList = computed(() => [
    { label: 'TCP 端口', value: info('tcp_port') || '-', icon: 'ri:router-line' },
    { label: '运行时间', value: `${info('uptime_in_days') ?? 0} 天`, icon: 'ri:time-line' },
    { label: '已用 CPU', value: `${Number(info('used_cpu_sys') || 0).toFixed(2)} s`, icon: 'ri:pulse-line' },
    { label: '每秒处理命令', value: info('instantaneous_ops_per_sec') ?? 0, icon: 'ri:speed-line' },
    { label: '总处理命令数', value: info('total_commands_processed') ?? 0, icon: 'ri:terminal-line' },
    { label: 'Key 命中率', value: hitRate.value, icon: 'ri:check-double-line' },
    { label: '内存配置上限', value: info('maxmemory_human') || '-', icon: 'ri:database-line' },
    { label: '系统总内存', value: info('total_system_memory_human') || '-', icon: 'ri:hard-drive-2-line' },
    { label: '内存碎片率', value: info('mem_fragmentation_ratio') || '-', icon: 'ri:puzzle-line' },
    { label: 'AOF 持久化', value: info('aof_enabled') === '1' ? '已开启' : '未开启', icon: 'ri:save-line' },
    { label: 'RDB 最近状态', value: info('rdb_last_bgsave_status') || '-', icon: 'ri:refresh-line' },
    { label: '过期键数', value: info('expired_keys') ?? 0, icon: 'ri:timer-line' },
    { label: '淘汰键数', value: info('evicted_keys') ?? 0, icon: 'ri:delete-bin-line' },
    { label: '拒绝连接数', value: info('rejected_connections') ?? 0, icon: 'ri:forbid-line' },
    { label: '网络入口/出口', value: `${info('instantaneous_input_kbps') ?? 0} / ${info('instantaneous_output_kbps') ?? 0} kbps`, icon: 'ri:swap-line' },
    { label: '操作系统', value: (info('os') || '-').replace('microsoft-standard-WSL2', 'WSL2'), icon: 'ri:windows-line' },
    { label: 'Lua 内存', value: info('used_memory_lua_human') || '-', icon: 'ri:code-s-slash-line' },
    { label: '内存分配器', value: info('mem_allocator') || '-', icon: 'ri:apps-2-line' }
  ])

  const getList = async () => {
    modal.loading('加载中...')
    try {
      const res: any = await getCache()
      cache.value = res
      await nextTick()
      initCharts()
    } catch (e) {
      console.error(e)
    } finally {
      modal.closeLoading()
    }
  }

  /** 主题色渐变色板（用于图表） */
  const chartColors = computed(() => {
    const base = themeColor.value
    return [base, '#13DEB9', '#ffb100', '#ff6b6b', '#38C0FC', '#7A7FFF', '#377dff', '#13c2c2']
  })

  const initCharts = () => {
    // 命令统计：横向条形图（按调用次数降序，取 Top 15 更清晰）
    if (commandChartRef.value) {
      commandChart?.dispose()
      commandChart = echarts.init(commandChartRef.value)
      const stats = (cache.value?.commandStats || [])
        .map((i: any) => ({ name: i.name, value: parseFloat(i.value) }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 15)
        .reverse() // 反转使最大值显示在顶部
      commandChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>调用次数：${p[0].value}` },
        grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { color: '#888' }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
        yAxis: {
          type: 'category',
          data: stats.map((s: any) => s.name),
          axisLabel: { color: '#666', fontSize: 12 },
          axisLine: { lineStyle: { color: '#ddd' } },
          axisTick: { show: false }
        },
        series: [
          {
            type: 'bar',
            data: stats.map((s: any, idx: number) => ({
              value: s.value,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: chartColors.value[idx % chartColors.value.length] + 'cc' },
                  { offset: 1, color: chartColors.value[idx % chartColors.value.length] }
                ]),
                borderRadius: [0, 4, 4, 0]
              }
            })),
            barWidth: '60%',
            label: { show: true, position: 'right', color: '#666', fontSize: 11 }
          }
        ]
      })
    }
    // 内存使用：仪表盘（主题色）
    if (memoryChartRef.value) {
      memoryChart?.dispose()
      memoryChart = echarts.init(memoryChartRef.value)
      const used = parseFloat(cache.value?.info?.used_memory_human) || 0
      const peak = parseFloat(cache.value?.info?.used_memory_peak_human) || used || 1
      memoryChart.setOption({
        series: [
          {
            name: '内存消耗',
            type: 'gauge',
            min: 0,
            max: Math.ceil((peak * 1.2) / 100) * 100 || 2000,
            center: ['50%', '60%'],
            radius: '85%',
            progress: { show: true, width: 14, itemStyle: { color: themeColor.value } },
            axisLine: { lineStyle: { width: 14, color: [[1, '#eaecef']] } },
            pointer: { width: 5, length: '60%', itemStyle: { color: themeColor.value } },
            axisTick: { show: false },
            splitLine: { length: 10, lineStyle: { color: '#bbb', width: 2 } },
            axisLabel: { distance: 18, color: '#999', fontSize: 10 },
            anchor: { show: true, size: 16, itemStyle: { color: themeColor.value } },
            title: { show: true, offsetCenter: [0, '30%'], color: '#666', fontSize: 12 },
            detail: {
              valueAnimation: true,
              formatter: '{value} M',
              color: themeColor.value,
              fontSize: 20,
              fontWeight: 'bolder',
              offsetCenter: [0, '58%']
            },
            data: [{ value: used, name: '当前内存 (M)' }]
          }
        ]
      })
    }
  }

  const handleResize = () => {
    commandChart?.resize()
    memoryChart?.resize()
  }
  onMounted(() => {
    getList()
    window.addEventListener('resize', handleResize)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    commandChart?.dispose()
    memoryChart?.dispose()
  })
</script>

<style lang="scss" scoped>
  @reference '@styles/core/tailwind.css';

  .cache-page {
    display: flex;
    flex-direction: column;
    min-height: var(--xuya-full-height);
  }

  /* 图表容器最小高度，flex-1 时撑满卡片剩余空间 */
  .chart-box {
    min-height: 320px;
    width: 100%;
  }

  @media (max-width: 768px) {
    .chart-box {
      min-height: 260px;
    }
  }
</style>
