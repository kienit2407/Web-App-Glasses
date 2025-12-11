const RAW_API_URL = import.meta.env.VITE_API_URL;
export const API_BASE_URL =  RAW_API_URL.replace(/\/+$/, ''); // bỏ hết / ở cuối