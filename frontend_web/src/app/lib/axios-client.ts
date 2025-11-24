import { useAuth } from '@/hooks/use-auth'
import axios, { AxiosError } from 'axios'
import { error } from 'console'

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'x-client-platform': 'web'
  }
})

API.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuth.getState()
    // Gắn access token vào mỗi lần gọi
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config // nếu không có token thì gử bình thường để gọi refresh token
  },
  (err) => { // nếu lỗi thì từ chối lệnh đó luôn
    return Promise.reject(err)
  }
)
API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url;
    // Lấy state hiện tại
    const { accessToken } = useAuth.getState();

  
    if (!accessToken) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry && url !== "/auth/refresh") {
      originalRequest._retry = true // gọi lại khi lấy được access token mới thành không
      try {
        console.log("tiến hành gọi refresh token")
        const res = await API.post('/auth/refresh')
        const newAccessToken = res.data?.data.tokens.accessToken
        console.log("đã có accesstoken mới ", newAccessToken)
        // set lại accesstoken
        const authState = useAuth.getState()
        authState.setAccessToken(newAccessToken)
        // recall request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return API(originalRequest)
      } catch (error) {
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)
