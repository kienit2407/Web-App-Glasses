/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/service/auth.service'                                                                                                                                                                                                                                                                                                
import { AuthUser, SignInPayload, SignUpPayload } from '@/types/auth.types'
import { API } from '@/app/lib/axios-client'

interface AuthState {
    user: AuthUser | null
    accessToken: string | null  // access token (sau này lấy từ BE)
    isLoading: boolean
    isBootstrapping: boolean // đang fetch me

    setAccessToken: (token: string | null) => void
    login: (data: SignInPayload) => Promise<void>
    signup: (data: SignUpPayload) => Promise<void>
    logout: () => Promise<void>
    fetchMe: () => Promise<void>
    bootstrap: () => Promise<void> // gọi 1 lần khi app mount
}
export const useAuth = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            isLoading: false,
            isBootstrapping: true,
            //action
            setAccessToken: (token) => set({ accessToken: token }),

            login: async (data: SignInPayload) => {
                set({ isLoading: true })
                try {
                    // gọi từ hàm service qua
                    const res = await authService.signIn(data)

                    const tokens = res.data?.data?.tokens
                    const accessToken = tokens?.accessToken ?? null
                    if (accessToken) {
                        set({ accessToken: accessToken })
                        const user = await get().fetchMe()
                    }
                    toast.success('Đăng nhập thành công')
                } catch (e: any) {
                    toast.error(e?.response?.data?.msg || 'Đăng nhập thất bại')
                } finally {
                    set({ isLoading: false })
                }
            },

            signup: async (data: SignUpPayload) => {
                set({ isLoading: true })
                try {
                    const res = await API.post('/auth/signup', data)
                    const accessToken = res.data?.data?.tokens?.accessToken
                    if (accessToken) {
                        set({ accessToken: accessToken })
                        await get().fetchMe()
                    }
                    toast.success('Đăng ký thành công')
                } catch (e: any) {
                    const msg = e?.response?.data?.msg || 'Đăng ký thất bại'
                    toast.error(msg)
                    throw e
                } finally {
                    set({ isLoading: false })
                }
            },

            logout: async () => {
                set({ isLoading: true })
                try {
                    await API.post('/auth/logout')
                } catch (err) {
                    console.error('logout error:', err)
                } finally {
                    set({
                        user: null,
                        accessToken: null,
                        isLoading: false
                    })
                    toast.success('Đăng xuất thành công')
                }
            },

            fetchMe: async () => {
                try {
                    const res = await API.get('/users/me')
                    const user = res.data?.data as AuthUser
                    set({ user : user })
                } catch (e) {
                    console.error('fetchMe error:', e)
                    throw e
                }
            },

            bootstrap: async () => {
                set({ isBootstrapping: true })
                try {
                    await get().fetchMe()
                } catch {
                    set({ user: null, accessToken: null })
                } finally {
                    set({ isBootstrapping: false })
                }
            }

        }),
        {
            name: 'auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
            })
        }
    )
)
