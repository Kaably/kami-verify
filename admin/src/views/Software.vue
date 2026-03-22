<template>
  <div class="page-card">
    <div class="page-header">
      <h3>软件管理</h3>
      <el-button type="primary" @click="showDialog()">添加软件</el-button>
    </div>

    <el-table :data="list" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="软件名称" />
      <el-table-column prop="app_key" label="AppKey" width="180" />
      <el-table-column prop="version" label="版本" width="80" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="showDialog(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="resetSecret(row)">重置密钥</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑软件' : '添加软件'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="form.version" />
        </el-form-item>
        <el-form-item label="公告">
          <el-input v-model="form.notice" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../utils/api'

const list = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, name: '', version: '', notice: '', description: '' })

async function loadList() {
  const res = await api.get('/software/list')
  list.value = res.data || []
}

function showDialog(row) {
  isEdit.value = !!row
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { id: null, name: '', version: '', notice: '', description: '' })
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const res = isEdit.value 
    ? await api.post('/software/update', form)
    : await api.post('/software/create', form)
  
  if (res.code === 200) {
    ElMessage.success(res.message)
    dialogVisible.value = false
    loadList()
  }
}

async function resetSecret(row) {
  await ElMessageBox.confirm('重置后原密钥将失效，确定重置？', '提示')
  const res = await api.post('/software/reset-secret', { id: row.id })
  if (res.code === 200) {
    ElMessage.success('密钥已重置')
    loadList()
  }
}

onMounted(loadList)
</script>
