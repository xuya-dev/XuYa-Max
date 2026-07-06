<!--
  XuyaIconSelect 图标选择器（基于 Iconify）

  提供常用图标网格选择 + 自定义 Iconify 图标名输入。
  XuYa-Max 使用 @iconify/vue 渲染图标（ri:xxx、ep:xxx、mdi:xxx 等）。

  用法：
    <XuyaIconSelect v-model="form.icon" />
-->
<template>
  <div class="relative" :style="{ width: width }">
    <ElInput :model-value="modelValue" readonly placeholder="点击选择图标" @click="visible = !visible">
      <template #prepend>
        <XuyaSvgIcon :icon="modelValue" v-if="modelValue" style="font-size: 16px" />
        <span v-else class="text-gray-400">无</span>
      </template>
    </ElInput>

    <ElPopover :visible="visible" placement="bottom-end" trigger="click" :width="450" @hide="onHide">
      <template #reference>
        <div
          class="cursor-pointer text-[#999] absolute right-[10px] top-0 h-[32px] leading-[32px]"
          @click="visible = !visible"
        >
          <ElIcon v-show="visible"><CaretTop /></ElIcon>
          <ElIcon v-show="!visible"><CaretBottom /></ElIcon>
        </div>
      </template>

      <ElInput
        v-model="filterValue"
        class="p-2"
        placeholder="搜索图标"
        clearable
        @input="filterIcons"
      />

      <div class="iconify-panel">
        <div class="iconify-heading">也可以直接输入 Iconify 图标名</div>
        <div class="iconify-form">
          <ElInput
            v-model="customIcon"
            placeholder="例如：ri:dashboard-line"
            clearable
            @keyup.enter="applyCustomIcon"
          />
          <ElButton type="primary" plain @click="applyCustomIcon">使用</ElButton>
        </div>
      </div>

      <ElScrollbar height="280px">
        <ul class="icon-list">
          <ElTooltip
            v-for="(iconName, index) in iconNames"
            :key="index"
            :content="iconName"
            placement="bottom"
            effect="light"
            :teleported="false"
            :enterable="false"
          >
            <li
              :class="['icon-item', { active: modelValue === iconName }]"
              @click="selectedIcon(iconName)"
            >
              <XuyaSvgIcon :icon="iconName" style="font-size: 20px" />
            </li>
          </ElTooltip>
        </ul>
      </ElScrollbar>
    </ElPopover>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { CaretTop, CaretBottom } from '@element-plus/icons-vue'

  defineOptions({ name: 'XuyaIconSelect' })

  interface Props {
    modelValue?: string
    width?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    width: '400px'
  })

  const emit = defineEmits(['update:modelValue'])
  const visible = ref(false)
  const filterValue = ref('')
  const customIcon = ref('')

  // 预置常用 Iconify 图标（与 XuYa-Max 常用图标对应的 iconify 名）
  const PRESET_ICONS: string[] = [
    // 系统类
    'ri:dashboard-line', 'ri:user-line', 'ri:shield-user-line', 'ri:menu-line', 'ri:tree-line',
    'ri:building-line', 'ri:briefcase-line', 'ri:book-line', 'ri:notification-3-line', 'ri:settings-3-line',
    'ri:tools-line', 'ri:dashboard-2-line', 'ri:list-check', 'ri:database-2-line', 'ri:cloud-line',
    // 操作类
    'ri:add-line', 'ri:edit-line', 'ri:delete-bin-line', 'ri:search-line', 'ri:refresh-line',
    'ri:download-line', 'ri:upload-line', 'ri:eye-line', 'ri:close-line', 'ri:check-line',
    // 业务类
    'ri:key-2-line', 'ri:lock-line', 'ri:mail-line', 'ri:phone-line', 'ri:image-line',
    'ri:file-text-line', 'ri:folder-line', 'ri:flow-chart', 'ri:rocket-line', 'ri:cpu-line',
    // 状态类
    'ri:check-double-line', 'ri:error-warning-line', 'ri:information-line', 'ri:question-line', 'ri:loader-line'
  ]

  const iconNames = ref<string[]>([...PRESET_ICONS])

  const filterIcons = () => {
    if (filterValue.value) {
      iconNames.value = PRESET_ICONS.filter((name) => name.includes(filterValue.value))
    } else {
      iconNames.value = [...PRESET_ICONS]
    }
  }

  const selectedIcon = (iconName: string) => {
    emit('update:modelValue', iconName)
    visible.value = false
  }

  const applyCustomIcon = () => {
    const value = customIcon.value.trim()
    if (!value) return
    emit('update:modelValue', value)
    visible.value = false
  }

  const onHide = () => {
    filterValue.value = ''
    filterIcons()
  }

  // 回填自定义图标输入框（若当前值是 iconify 全名）
  watch(
    () => props.modelValue,
    (value) => {
      customIcon.value = value?.includes(':') ? value : ''
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .iconify-panel {
    padding: 2px 4px 12px;
  }
  .iconify-heading {
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
  }
  .iconify-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }
  .icon-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
    gap: 8px;
    padding: 4px;
    margin-top: 10px;

    .icon-item {
      cursor: pointer;
      min-height: 44px;
      padding: 8px 6px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      background: var(--el-fill-color-blank);
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        transform: translateY(-1px);
      }
    }

    .active {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
</style>
