<!--
  XuyaTreePanel 通用树面板（移植自 plus-ui TreePanel）
  - 基于 el-tree-v2 虚拟滚动，适合大数据量
  - 可折叠侧栏（v-model:collapsed）
  - 自适应高度、停用节点禁用态、防抖过滤
  - 用法：
      <XuyaTreePanel v-model:collapsed="collapsed" title="部门结构" :data="deptOptions" @node-click="handleNodeClick" />
-->
<template>
  <div class="xuya-tree-panel" :class="{ 'is-collapsed': modelCollapsed }">
    <div class="xuya-card-sm tree-shell">
      <!-- 头部（可点击折叠） -->
      <div class="tree-header" @click="toggleCollapsed">
        <span v-if="!modelCollapsed" class="text-sm font-medium text-g-800">{{ title }}</span>
        <XuyaSvgIcon :icon="modelCollapsed ? 'ri:expand-right-line' : 'ri:fold-line'" class="text-g-600 c-p" />
      </div>

      <!-- 内容（折叠时隐藏） -->
      <div v-show="!modelCollapsed" class="tree-body">
        <ElInput v-model="filterText" :placeholder="placeholder" :prefix-icon="Search" clearable size="small" class="mb-2" />
        <div ref="treeWrapRef" class="tree-wrap">
          <ElTreeV2
            ref="treeRef"
            :data="treeData"
            :props="mergedTreeProps as any"
            :height="treeHeight"
            :item-size="28"
            :expand-on-click-node="false"
            :default-expanded-keys="defaultExpandedKeys"
            :filter-method="internalFilterNode"
            highlight-current
            @node-click="onNodeClick"
          >
            <template #default="{ node, data }">
              <span class="tree-node-label" :class="{ 'is-disabled': isNodeDisabled(data) }">
                <span>{{ node.label }}</span>
                <ElTooltip v-if="isNodeDisabled(data)" content="停用" placement="top">
                  <XuyaSvgIcon icon="ri:forbid-line" class="tree-node-disabled-icon" />
                </ElTooltip>
              </span>
            </template>
          </ElTreeV2>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, shallowRef, computed, watch, nextTick, toRaw } from 'vue'
  import { Search } from '@element-plus/icons-vue'
  import { useElementSize, useDebounceFn } from '@vueuse/core'
  import XuyaSvgIcon from '@/components/core/base/xuya-svg-icon/index.vue'

  defineOptions({ name: 'XuyaTreePanel' })

  const props = withDefaults(
    defineProps<{
      /** 面板标题 */
      title?: string
      /** 搜索占位文字 */
      placeholder?: string
      /** 树数据 */
      data: any[]
      /** node-key */
      nodeKey?: string
      /** el-tree props 配置 */
      treeProps?: Record<string, string>
      /** 节点禁用字段名 */
      disabledField?: string
      /** 默认过滤字段名 */
      filterField?: string
      /** 自定义过滤方法 */
      filterNodeMethod?: (value: string, data: any) => boolean
      /** 折叠状态 */
      collapsed?: boolean
    }>(),
    {
      title: '结构',
      placeholder: '请输入名称',
      nodeKey: 'id',
      treeProps: () => ({ label: 'label', children: 'children' }),
      disabledField: 'disabled',
      filterField: 'label',
      collapsed: false
    }
  )

  const emit = defineEmits<{
    'update:collapsed': [value: boolean]
    'node-click': [data: any, node: any, component: any]
  }>()

  const modelCollapsed = computed({
    get: () => props.collapsed,
    set: (val: boolean) => emit('update:collapsed', val)
  })

  const filterText = ref('')
  const treeRef = ref<any>()
  const treeWrapRef = ref<HTMLElement>()
  const treeData = shallowRef<any[]>([])
  const defaultExpandedKeys = shallowRef<any[]>([])
  const { height: treeWrapHeight } = useElementSize(treeWrapRef)
  const treeHeight = computed(() => Math.max(Math.floor(treeWrapHeight.value), 180))

  const mergedTreeProps = computed(() => {
    const label = props.treeProps?.label ?? 'label'
    const children = props.treeProps?.children ?? 'children'
    const value = props.treeProps?.value ?? props.nodeKey
    if (!props.disabledField) {
      return { ...props.treeProps, value, label, children }
    }
    return { ...props.treeProps, value, label, children, disabled: props.treeProps?.disabled ?? props.disabledField }
  })

  const isNodeDisabled = (data: any) => {
    if (!props.disabledField) return false
    return Boolean(data?.[props.disabledField])
  }

  const toggleCollapsed = () => {
    modelCollapsed.value = !modelCollapsed.value
  }

  const getNodeKey = (data: any) => data?.[props.nodeKey]

  const collectExpandedKeys = (nodes: any[], keys: any[] = []) => {
    const childrenField = props.treeProps?.children ?? 'children'
    for (const node of nodes) {
      const children = node?.[childrenField]
      if (Array.isArray(children) && children.length > 0) {
        const key = getNodeKey(node)
        if (key !== undefined) keys.push(key)
        collectExpandedKeys(children, keys)
      }
    }
    return keys
  }

  const internalFilterNode = (value: string, data: any) => {
    if (props.filterNodeMethod) return props.filterNodeMethod(value, data)
    if (!value) return true
    return data[props.filterField]?.indexOf(value) !== -1
  }

  const filterTree = useDebounceFn(() => {
    treeRef.value?.filter(filterText.value)
  }, 200)

  watch(filterText, () => filterTree())

  watch(
    () => props.data,
    (data) => {
      const rawData = toRaw(data)
      treeData.value = rawData
      defaultExpandedKeys.value = collectExpandedKeys(rawData)
      nextTick(() => {
        treeRef.value?.setData(rawData)
        treeRef.value?.setExpandedKeys(defaultExpandedKeys.value)
        if (filterText.value) filterTree()
      })
    },
    { immediate: true }
  )

  const onNodeClick = (data: any, node: any, component: any) => {
    if (isNodeDisabled(data)) {
      treeRef.value?.setCurrentKey(undefined)
      return
    }
    emit('node-click', data, node, component)
  }

  const setCurrentKey = (key: any) => treeRef.value?.setCurrentKey(key)

  defineExpose({ treeRef, setCurrentKey })
</script>

<style lang="scss" scoped>
  @reference '@styles/core/tailwind.css';

  .xuya-tree-panel {
    width: 240px;
    flex-shrink: 0;
    transition: width 0.24s ease;

    &.is-collapsed {
      width: 52px;
    }
  }

  .tree-shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .tree-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .is-collapsed & {
      justify-content: center;
      padding: 12px 0;
      border-bottom: none;
    }
  }

  .tree-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    padding: 12px;
  }

  .tree-wrap {
    flex: 1 1 auto;
    min-height: 180px;
    min-width: 0;
  }

  :deep(.tree-node-label) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    line-height: 22px;
    color: var(--el-text-color-primary);

    &.is-disabled {
      color: var(--el-color-danger);
    }
  }

  :deep(.tree-node-disabled-icon) {
    flex: 0 0 auto;
    font-size: 14px;
    color: var(--el-color-danger);
  }
</style>
