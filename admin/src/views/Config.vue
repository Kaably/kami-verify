<template>
  <div class="page-card">
    <div class="page-header">
      <h3>系统配置</h3>
    </div>

    <el-form :model="config" label-width="120px" style="max-width: 600px;">
      <el-form-item label="网站名称">
        <el-input v-model="config.site_name" />
      </el-form-item>
      <el-form-item label="网站公告">
        <el-input v-model="config.site_notice" type="textarea" :rows="3" />
      </el-form-item>
      <el-form-item label="允许注册">
        <el-switch v-model="config.allow_register" active-value="1" inactive-value="0" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
      </el-form-item>
    </el-form>

    <el-divider />

    <h3 style="margin-bottom: 20px;">修改密码</h3>
    <el-form :model="passwordForm" label-width="120px" style="max-width: 600px;">
      <el-form-item label="原密码">
        <el-input v-model="passwordForm.oldPassword" type="password" />
      </el-form-item>
      <el-form-item label="新密码">
        <el-input v-model="passwordForm.newPassword" type="password" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="changePassword">修改密码</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

const config = reactive({
  site_name: '',
  site_notice: '',
  allow_register: '1'
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: ''
})

async function loadConfig() {
  const res = await api.get('/config/list')
  if (res.code === 200 && res.data) {
    Object.assign(config, res.data)
  }
}

async function saveConfig() {
  const res = await api.post('/config/update', { configs: config })
  if (res.code === 200) {
    ElMessage.success('保存成功')
  }
}

async function changePassword() {
  const res = await api.post('/auth/change-password', passwordForm)
  if (res.code === 200) {
    ElMessage.success('密码修改成功')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
  }
}

onMounted(loadConfig)
</script>
