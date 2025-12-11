import mongoose, { Mongoose } from 'mongoose'
import { env } from './environment'

//Khởi tạo instance global để có thể sử dụng toàn app
// let dataBaseConnectInstance = null //biến global
export const CONNECTDB = async (): Promise<void> => {
    if (!env.MONGODB_URI) throw new Error("Url is not Set")
    await mongoose.connect(env.MONGODB_URI, { dbName: env.DATABASE_NAME })
}

export const CLOSE_DB = async (): Promise<void> => {
    await mongoose.connection.close()
}