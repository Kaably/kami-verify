<template>
  <div class="packer-page">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="upload-card">
          <template #header>
            <div class="card-header">
              <span>软件一键加密</span>
              <el-tag type="info">支持 EXE / DLL 文件</el-tag>
            </div>
          </template>

          <div class="upload-section">
            <el-form :model="form" label-width="120px">
              <el-form-item label="选择软件" required>
                <el-select v-model="form.software_id" placeholder="请选择要绑定的软件" style="width: 100%">
                  <el-option
                    v-for="item in softwareList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  >
                    <span>{{ item.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ item.app_key }}</span>
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="上传文件" required>
                <el-upload
                  class="file-uploader"
                  drag
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  :limit="1"
                  accept=".exe,.dll"
                >
                  <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                  <div class="el-upload__text">
                    将文件拖到此处，或 <em>点击上传</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      仅支持 .exe 和 .dll 文件，文件大小不超过 50MB
                    </div>
                  </template>
                </el-upload>
              </el-form-item>

              <el-divider>加密配置</el-divider>

              <el-form-item label="界面主题">
                <el-radio-group v-model="form.template_style">
                  <el-radio-button label="default">默认深蓝</el-radio-button>
                  <el-radio-button label="dark">暗黑模式</el-radio-button>
                  <el-radio-button label="blue">科技蓝</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="保护选项">
                <el-checkbox v-model="form.random_filename">随机文件名</el-checkbox>
                <el-checkbox v-model="form.anti_debug">反调试保护</el-checkbox>
                <el-checkbox v-model="form.vm_protect">虚拟机检测</el-checkbox>
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  :loading="uploading"
                  :disabled="!canSubmit"
                  @click="handleEncrypt"
                >
                  <el-icon><lock /></el-icon>
                  开始加密
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>

        <el-card class="preview-card" v-if="form.template_style">
          <template #header>
            <span>验证窗口预览</span>
          </template>
          <div class="preview-window" :class="form.template_style">
            <div class="preview-title">ICY卡密验证系统</div>
            <div class="preview-subtitle">{{ getSoftwareName() }}</div>
            <div class="preview-input">
              <span>卡密：</span>
              <div class="fake-input">XXXX-XXXX-XXXX-XXXX</div>
            </div>
            <div class="preview-buttons">
              <button class="preview-btn primary">验证卡密</button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <span>加密记录</span>
          </template>
          <div class="history-list">
            <div v-for="item in historyList" :key="item.id" class="history-item">
              <div class="history-info">
                <div class="history-name">{{ item.original_name }}</div>
                <div class="history-meta">
                  <el-tag size="small" :type="getStatusType(item.status)">
                    {{ getStatusText(item.status) }}
                  </el-tag>
                  <span class="history-time">{{ formatTime(item.created_at) }}</span>
                </div>
              </div>
              <div class="history-actions">
                <el-button
                  v-if="item.status === 'completed'"
                  type="primary"
                  size="small"
                  @click="downloadFile(item)"
                >
                  下载
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  @click="deleteItem(item)"
                >
                  删除
                </el-button>
              </div>
            </div>
            <el-empty v-if="historyList.length === 0" description="暂无加密记录" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="encryptingDialog" title="正在加密" width="400px" :close-on-click-modal="false" :show-close="false">
      <div class="encrypting-content">
        <el-progress :percentage="encryptProgress" :status="encryptStatus" />
        <p>{{ encryptMessage }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Lock } from '@element-plus/icons-vue'
import api from '../utils/api'

const softwareList = ref([])
const historyList = ref([])
const uploading = ref(false)
const encryptingDialog = ref(false)
const encryptProgress = ref(0)
const encryptStatus = ref('')
const encryptMessage = ref('准备加密...')

const form = ref({
  software_id: '',
  file: null,
  template_style: 'default',
  random_filename: false,
  anti_debug: true,
  vm_protect: false
})

const canSubmit = computed(() => {
  return form.value.software_id && form.value.file
})

onMounted(() => {
  loadSoftwareList()
  loadHistory()
})

async function loadSoftwareList() {
  try {
    const res = await api.get('/software/list')
    if (res.data.code === 200) {
      softwareList.value = res.data.data
    }
  } catch (error) {
    console.error('加载软件列表失败:', error)
  }
}

async function loadHistory() {
  try {
    const res = await api.get('/packer/list')
    if (res.data.code === 200) {
      historyList.value = res.data.data
    }
  } catch (error) {
    console.error('加载历史记录失败:', error)
  }
}

function handleFileChange(file) {
  const ext = file.name.slice(-4).toLowerCase()
  if (!['.exe', '.dll'].includes(ext)) {
    ElMessage.error('仅支持 EXE 和 DLL 文件')
    form.value.file = null
    return
  }
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 50MB')
    form.value.file = null
    return
  }
  form.value.file = file.raw
}

function getSoftwareName() {
  const software = softwareList.value.find(s => s.id === form.value.software_id)
  return software ? software.name : '请选择软件'
}

async function handleEncrypt() {
  if (!form.value.software_id || !form.value.file) {
    ElMessage.warning('请选择软件并上传文件')
    return
  }

  uploading.value = true
  encryptingDialog.value = true
  encryptProgress.value = 0
  encryptStatus.value = ''
  encryptMessage.value = '正在上传文件...'

  try {
    const reader = new FileReader()
    reader.readAsDataURL(form.value.file)
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1]

      encryptProgress.value = 30
      encryptMessage.value = '正在保存文件...'

      const uploadRes = await api.post('/packer/upload', {
        software_id: form.value.software_id,
        file_name: form.value.file.name,
        file_size: form.value.file.size,
        file_type: form.value.file.name.slice(-4).toLowerCase(),
        file_data: base64Data
      })

      if (uploadRes.data.code !== 200) {
        throw new Error(uploadRes.data.message)
      }

      encryptProgress.value = 60
      encryptMessage.value = '正在加密文件...'

      const encryptRes = await api.post('/packer/encrypt', {
        id: uploadRes.data.data.id,
        template_style: form.value.template_style,
        random_filename: form.value.random_filename,
        anti_debug: form.value.anti_debug,
        vm_protect: form.value.vm_protect
      })

      if (encryptRes.data.code !== 200) {
        throw new Error(encryptRes.data.message)
      }

      encryptProgress.value = 80
      encryptMessage.value = '正在生成下载链接...'

      await checkStatus(uploadRes.data.data.id)
    }
  } catch (error) {
    ElMessage.error('加密失败: ' + error.message)
    encryptStatus.value = 'exception'
    encryptMessage.value = '加密失败'
    setTimeout(() => {
      encryptingDialog.value = false
    }, 1500)
  } finally {
    uploading.value = false
  }
}

async function checkStatus(id) {
  const checkInterval = setInterval(async () => {
    try {
      const res = await api.get(`/packer/status/${id}`)
      if (res.data.code === 200) {
        const data = res.data.data
        if (data.status === 'completed') {
          clearInterval(checkInterval)
          encryptProgress.value = 100
          encryptStatus.value = 'success'
          encryptMessage.value = '加密完成！'
          setTimeout(() => {
            encryptingDialog.value = false
            loadHistory()
            ElMessage.success('加密成功！')
          }, 1000)
        } else if (data.status === 'failed') {
          clearInterval(checkInterval)
          encryptStatus.value = 'exception'
          encryptMessage.value = '加密失败'
          setTimeout(() => {
            encryptingDialog.value = false
          }, 1500)
        }
      }
    } catch (error) {
      console.error('检查状态失败:', error)
    }
  }, 1000)
}

function downloadFile(item) {
  const fileId = item.download_url.split('/').pop()
  const url = `${api.defaults.baseURL}/packer/download/${fileId}`
  window.open(url, '_blank')
}

async function deleteItem(item) {
  try {
    await ElMessageBox.confirm('确定要删除这个加密记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await api.post('/packer/delete', { id: item.id })
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      loadHistory()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

function getStatusType(status) {
  const types = {
    pending: 'info',
    uploaded: 'info',
    encrypting: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '等待中',
    uploaded: '已上传',
    encrypting: '加密中',
    completed: '已完成',
    failed: '失败'
  }
  return texts[status] || status
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString()
}
</script>

<style scoped>
.packer-page {
  padding: 20px;
}

.upload-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-uploader {
  width: 100%;
}

.preview-card {
  margin-top: 20px;
}

.preview-window {
  width: 320px;
  height: 200px;
  border-radius: 8px;
  padding: 20px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.preview-window.default {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

.preview-window.dark {
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  color: #e0e0e0;
}

.preview-window.blue {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
}

.preview-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.preview-subtitle {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 20px;
}

.preview-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.fake-input {
  width: 180px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.preview-btn {
  padding: 8px 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.preview-btn.primary {
  background: #0f3460;
  color: #fff;
}

.preview-window.dark .preview-btn.primary {
  background: #2d2d2d;
}

.preview-window.blue .preview-btn.primary {
  background: #3b82f6;
}

.history-list {
  max-height: 600px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
}

.history-item:last-child {
  border-bottom: none;
}

.history-name {
  font-weight: 500;
  margin-bottom: 8px;
  word-break: break-all;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-time {
  font-size: 12px;
  color: #909399;
}

.history-actions {
  display: flex;
  gap: 5px;
}

.encrypting-content {
  text-align: center;
  padding: 20px;
}

.encrypting-content p {
  margin-top: 15px;
  color: #606266;
}
</style>
