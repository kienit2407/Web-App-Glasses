import { Response } from "express"


export const sendAsSuccess = (res: Response, status: any, data: any = null, mgs?: string,) => {
    return res.status(status).json({
        status,
        mgs: "Success",
        success: true,
        data: data
    })
}
export const sendAsFailure = (res: Response, status: any, mgs?: string) => {
    return res.status(status).json({
        status,
        mgs: mgs ?? "Failure !",
        success: false,
    })
}