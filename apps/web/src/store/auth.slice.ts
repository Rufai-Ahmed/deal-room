import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import type { AuthSession, AuthUser } from '@dealroom/shared';

const TOKEN_KEY = 'dealroom.token';

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

const initialState: AuthState = {
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn: (state, action: PayloadAction<AuthSession>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
    },
    tokenReceived: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem(TOKEN_KEY, action.payload);
    },
    userLoaded: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
    signedOut: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});

export const { signedIn, tokenReceived, userLoaded, signedOut } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
