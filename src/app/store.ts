import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../api/baseApi';
import authReducer, { AUTH_STORAGE_KEY } from '../features/auth/authSlice';
import childReducer from '../features/child/childSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    child: childReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(baseApi.middleware),
});

// Parents stay signed in on their phone (long refresh token); keep the session across reloads
let lastAuth = store.getState().auth;
store.subscribe(() => {
  const auth = store.getState().auth;
  if (auth === lastAuth) return;
  lastAuth = auth;
  if (auth.accessToken) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
