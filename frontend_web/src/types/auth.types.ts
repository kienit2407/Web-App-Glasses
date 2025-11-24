export type Role = 'user' | 'admin'
export interface SignUpPayload {
    email: string
    display_name: string
    password: string
}

export interface SignInPayload {
    email: string
    password: string
}
export interface AuthUser {
    _id: string
    avatar_url: string
    avatar_id: string
    email: string
    display_name: string
    roles: Role[]
}