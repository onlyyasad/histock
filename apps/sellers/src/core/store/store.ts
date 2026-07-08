import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from './apiSlice'
import { authReducer } from '../../features/auth/store/authSlice'

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
