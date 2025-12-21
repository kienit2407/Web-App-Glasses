import { v4 as uuidv4 } from 'uuid' // [MỚI] Import UUID

// [MỚI] Hàm lấy hoặc tạo Device ID lưu vào LocalStorage
// Giúp Arcjet nhận diện chính xác trình duyệt này là ai
export const getDeviceId = () => {
    const STORAGE_KEY = 'x_device_id';
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
}