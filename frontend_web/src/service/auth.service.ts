
import { API } from "@/app/lib/axios-client"
import { SignInPayload } from "@/types/auth.types"

const signIn = async (body : SignInPayload) => {
    return await API.post('/auth/login', body)
}

export const authService = {
    signIn
}