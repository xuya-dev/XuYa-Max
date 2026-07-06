<!--
  用户新增/编辑弹窗
-->
<template>
  <ElDialog v-model="visibleRef" :title="title" width="680px" append-to-body @close="handleClose">
    <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="用户昵称" prop="nickName">
            <ElInput v-model="form.nickName" placeholder="请输入用户昵称" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="部门" prop="deptId">
            <ElTreeSelect
              v-model="form.deptId"
              :data="deptOptions"
              :props="({ value: 'id', label: 'label', children: 'children' } as any)"
              value-key="id"
              placeholder="请选择部门"
              check-strictly
              style="width: 100%"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="手机号码" prop="phoneNumber">
            <ElInput v-model="form.phoneNumber" placeholder="请输入手机号码" maxlength="11" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="邮箱" prop="email">
            <ElInput v-model="form.email" placeholder="请输入邮箱" />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow v-if="!form.userId">
        <ElCol :span="12">
          <ElFormItem label="用户名称" prop="userName">
            <ElInput v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="用户密码" prop="password">
            <ElInput v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="用户性别">
            <ElSelect v-model="form.gender" placeholder="请选择" style="width: 100%">
              <ElOption
                v-for="item in sys_user_gender"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="状态">
            <ElRadioGroup v-model="form.status">
              <ElRadio
                v-for="item in sys_normal_disable"
                :key="item.value"
                :value="item.value"
                >{{ item.label }}</ElRadio
              >
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :span="12">
          <ElFormItem label="岗位">
            <ElSelect v-model="form.postIds" multiple placeholder="请选择岗位" style="width: 100%">
              <ElOption
                v-for="item in postOptions"
                :key="item.postId"
                :label="item.postName"
                :value="item.postId"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="角色">
            <ElSelect v-model="form.roleIds" multiple placeholder="请选择角色" style="width: 100%">
              <ElOption
                v-for="item in roleOptions"
                :key="item.roleId"
                :label="item.roleName"
                :value="item.roleId"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>
      <ElRow>
        <ElCol :span="24">
          <ElFormItem label="备注">
            <ElInput v-model="form.remark" type="textarea" placeholder="请输入内容" />
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
    <template #footer>
      <ElButton @click="visibleRef = false">取 消</ElButton>
      <ElButton type="primary" :loading="submitting" @click="handleSubmit">确 定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { useDict } from '@/hooks/core/useDict'
  import { addUser, updateUser } from '@/api/system/user'
  import type { UserForm } from '@/api/system/user/types'

  interface Props {
    visible: boolean
    title: string
    form: Partial<UserForm>
    deptOptions: any[]
    postOptions: any[]
    roleOptions: any[]
  }
  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'success'): void
  }
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const { sys_user_gender, sys_normal_disable } = useDict('sys_user_gender', 'sys_normal_disable')

  const visibleRef = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const form = reactive<Partial<UserForm>>({})

  // 同步外部 form 到内部
  watch(
    () => props.form,
    (val) => {
      Object.assign(form, val)
    },
    { immediate: true, deep: true }
  )

  const rules = computed<FormRules>(() => ({
    userName: [{ required: !form.userId, message: '请输入用户名称', trigger: 'blur' }],
    nickName: [{ required: true, message: '请输入用户昵称', trigger: 'blur' }],
    password: [
      { required: !form.userId, message: '请输入用户密码', trigger: 'blur' },
      { min: 5, max: 20, message: '长度在 5 到 20 个字符', trigger: 'blur' }
    ],
    email: [{ type: 'email' as const, message: '请输入正确的邮箱', trigger: ['blur', 'change'] }],
    phoneNumber: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }]
  }))

  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      submitting.value = true
      if (form.userId) {
        await updateUser(form as UserForm)
        ElMessage.success('修改成功')
      } else {
        await addUser(form as UserForm)
        ElMessage.success('新增成功')
      }
      visibleRef.value = false
      emit('success')
    } catch (e) {
      // 校验失败或接口错误
    } finally {
      submitting.value = false
    }
  }

  const handleClose = () => {
    formRef.value?.resetFields()
  }
</script>
