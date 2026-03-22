<template>
  <div class="login-container">
    <div class="particles">
      <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>
    
    <div class="login-box">
      <div class="logo-section">
        <div class="logo-icon">🔐</div>
        <h2 class="login-title">ICY卡密验证系统</h2>
        <p class="login-subtitle">Card Key Verification System</p>
      </div>
      
      <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名" 
            prefix-icon="User" 
            size="large"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock" 
            size="large" 
            show-password
            @keyup.enter="handleLogin" 
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            style="width: 100%" 
            :loading="loading" 
            @click="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-features">
        <div class="feature-item">
          <span class="feature-icon">🛡️</span>
          <span>安全加密</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <span>快速验证</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📊</span>
          <span>数据统计</span>
        </div>
      </div>
      
      <div class="login-footer">
        <p>© 2026 ICY Card Verification System</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

function getParticleStyle(index) {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const delay = Math.random() * 20
  const duration = Math.random() * 10 + 15
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

async function handleLogin() {
  await formRef.value.validate()
  loading.value = true
  try {
    const res = await authStore.login(form.username, form.password)
    if (res.code === 200) {
      ElMessage.success('登录成功！')
      router.push('/')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #000000 0%, #1a1a1a 25%, #0d0d0d 50%, #1a1a1a 75%, #000000 100%);
  position: relative;
  overflow: hidden;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  bottom: -10px;
  background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
  border-radius: 50%;
  opacity: 0.3;
  animation: float linear infinite;
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.3;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(212, 175, 55, 0.03) 0%, transparent 50%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.login-box {
  width: 420px;
  padding: 50px 40px;
  background: linear-gradient(145deg, rgba(20, 20, 20, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%);
  border-radius: 20px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(212, 175, 55, 0.1);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.logo-section {
  text-align: center;
  margin-bottom: 35px;
}

.logo-icon {
  font-size: 50px;
  margin-bottom: 15px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.login-title {
  color: #d4af37;
  font-size: 28px;
  margin: 0 0 8px 0;
  font-weight: 600;
  letter-spacing: 3px;
  text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

.login-subtitle {
  color: #555;
  font-size: 12px;
  margin: 0;
  letter-spacing: 2px;
}

.login-form {
  margin-bottom: 25px;
}

.login-box :deep(.el-input__wrapper) {
  background: rgba(30, 30, 30, 0.8) !important;
  border: 1px solid rgba(212, 175, 55, 0.2) !important;
  box-shadow: none !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
}

.login-box :deep(.el-input__wrapper:hover) {
  border-color: rgba(212, 175, 55, 0.4) !important;
}

.login-box :deep(.el-input__wrapper.is-focus) {
  border-color: #d4af37 !important;
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.2) !important;
}

.login-box :deep(.el-input__inner) {
  color: #d4af37 !important;
}

.login-box :deep(.el-input__inner::placeholder) {
  color: #555 !important;
}

.login-box :deep(.el-input__prefix) {
  color: #d4af37 !important;
}

.login-box :deep(.el-button--primary) {
  background: linear-gradient(135deg, #d4af37 0%, #b8960c 100%) !important;
  border: none !important;
  font-weight: 600;
  letter-spacing: 5px;
  transition: all 0.3s ease;
  border-radius: 10px !important;
  height: 48px !important;
}

.login-box :deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%) !important;
  box-shadow: 0 0 25px rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.login-box :deep(.el-button--primary:active) {
  transform: translateY(0);
}

.login-features {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 25px;
  padding-top: 15px;
  border-top: 1px solid rgba(212, 175, 55, 0.1);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 12px;
}

.feature-icon {
  font-size: 24px;
}

.login-footer {
  text-align: center;
  color: #333;
  font-size: 12px;
}

/* 手机端适配 */
@media screen and (max-width: 768px) {
  .login-box {
    width: 90%;
    max-width: 380px;
    padding: 30px 20px;
    margin: 10px;
    border-radius: 15px;
  }

  .logo-section {
    margin-bottom: 25px;
  }

  .logo-icon {
    font-size: 40px;
    margin-bottom: 10px;
  }

  .login-title {
    font-size: 22px;
    letter-spacing: 2px;
  }

  .login-subtitle {
    font-size: 10px;
  }

  .login-form {
    margin-bottom: 20px;
  }

  .login-features {
    gap: 15px;
    flex-wrap: wrap;
  }

  .feature-item {
    font-size: 11px;
  }

  .feature-icon {
    font-size: 20px;
  }

  .particles {
    display: none;
  }
}

@media screen and (max-width: 480px) {
  .login-box {
    width: 95%;
    padding: 25px 15px;
  }

  .logo-icon {
    font-size: 35px;
  }

  .login-title {
    font-size: 18px;
  }

  .login-features {
    gap: 10px;
  }

  .feature-item {
    font-size: 10px;
  }
}
</style>
