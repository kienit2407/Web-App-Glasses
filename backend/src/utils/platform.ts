
import { Request } from 'express'
import { Platform } from '../utils/jwt' // 'web' | 'mobile'

export const getPlatformFromReq = (req: Request): Platform => {
    const raw = String(req.headers['x-client-platform'] || 'web').toLowerCase()
    if (raw === 'mobile') return 'mobile'
    return 'web' // default
}