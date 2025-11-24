import mongoose, { Mongoose } from 'mongoose'
import { env } from './environment'

//Khởi tạo instance global để có thể sử dụng toàn app
// let dataBaseConnectInstance = null //biến global
interface Environment {
    MONGODB_LOCAL: string
    DATABASE_NAME: string
}


export const CONNECTDB = async (): Promise<void> => {
    if (!env.MONGODB_LOCAL) throw new Error("Url is not Set")
    await mongoose.connect(env.MONGODB_LOCAL, { dbName: env.DATABASE_NAME })
}

export const CLOSE_DB = async (): Promise<void> => {
    await mongoose.connection.close()
}