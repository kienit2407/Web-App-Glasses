import { useAuth } from '@/hooks/use-auth'
import { getDeviceId } from '@/utils/get_dv_id'
import { message } from 'antd'
import axios, { AxiosError } from 'axios'
import { error } from 'console'

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: {
    'x-client-platform': 'web',
    // [LƯU Ý]: Không gọi getDeviceId() ở đây ngay vì có thể lúc init chưa access được localStorage
    // Chúng ta sẽ gắn ở Interceptor bên dưới cho chắc ăn
  }
})

API.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuth.getState()
    // Gắn access token vào mỗi lần gọi
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    // 2. [MỚI] Gắn Device ID cho Arcjet
    // Backend sẽ dùng cái này thay vì IP để Rate Limit chuẩn hơn
    config.headers['x-device-id'] = getDeviceId();
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
    // [MỚI] XỬ LÝ LỖI BẢO MẬT TỪ ARCJET (Global Handler)
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Case 1: Quá tải (Rate Limit) -> 429
      if (status === 429) {
        // Thay alert bằng thư viện Toast của bạn (vd: react-hot-toast / sonner)
        message.error("Bạn thao tác quá nhanh! Vui lòng đợi vài giây.");
        // Có thể return luôn để component không cần catch lỗi nữa (tuỳ logic app)
        return Promise.reject(error);
      }

      // Case 2: Bị chặn do Bot hoặc Tấn công -> 403
      if (status === 403 && data.code === 'BOT_DETECTED') {
        message.error("Hệ thống phát hiện truy cập bất thường.");
        return Promise.reject(error);
      }

      if (status === 403 && data.code === 'ACCESS_DENIED') {
        message.error("Yêu cầu bị chặn vì lý do bảo mật.");
        return Promise.reject(error);
      }
    }

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
