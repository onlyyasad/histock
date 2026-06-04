import axios from 'axios'
import { toast } from 'sonner'

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      toast.error('Your session has expired. Please log in again.')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
