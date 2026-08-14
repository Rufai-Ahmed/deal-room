import type {
  AuthSession,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '@dealroom/shared';
import { baseApi } from './base.api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthSession, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),

    login: builder.mutation<AuthSession, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    me: builder.query<AuthUser, void>({
      query: () => ({ url: '/auth/me' }),
    }),

    authProviders: builder.query<{ google: boolean }, void>({
      query: () => ({ url: '/auth/providers' }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useMeQuery,
  useAuthProvidersQuery,
} = authApi;
