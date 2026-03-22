import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const admin = ref(JSON.parse(localStorage.getItem('admin') || 'null'))

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    if (res.code === 200) {
      token.value = res.data.token
      admin.value = res.data.admin
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('admin', JSON.stringify(res.data.admin))
    }
    return res
  }

  function logout() {
    token.value = ''
    admin.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
  }

  return { token, admin, login, logout }
})
