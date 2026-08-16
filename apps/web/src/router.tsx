import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router';
import { AuthCallbackPage } from './routes/auth-callback';
import { LoginPage, RegisterPage } from './routes/auth';
import { DocumentDetailPage } from './routes/document-detail';
import { DocumentsPage } from './routes/documents';
import { LandingPage } from './routes/landing';
import { ViewerPage } from './routes/viewer';
import { store } from './store/store';

const rootRoute = createRootRoute({ component: Outlet });

const requireSession = () => {
  if (!store.getState().auth.token) {
    throw redirect({ to: '/login' });
  }
};

const redirectIfSignedIn = () => {
  if (store.getState().auth.token) {
    throw redirect({ to: '/documents' });
  }
};

const routeTree = rootRoute.addChildren([
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: LandingPage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    component: LoginPage,
    beforeLoad: redirectIfSignedIn,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/register',
    component: RegisterPage,
    beforeLoad: redirectIfSignedIn,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth/callback',
    component: AuthCallbackPage,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/documents',
    component: DocumentsPage,
    beforeLoad: requireSession,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/documents/$documentId',
    component: DocumentDetailPage,
    beforeLoad: requireSession,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/view/$token',
    component: ViewerPage,
  }),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
