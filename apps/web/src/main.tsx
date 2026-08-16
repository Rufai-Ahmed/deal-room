import { StrictMode, useEffect } from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useMeQuery } from './apis';
import { ToastProvider } from './components/ui/toast';
import { router } from './router';
import { userLoaded } from './store/auth.slice';
import { store, type RootState } from './store/store';
import './styles.css';

const SessionBootstrap = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const { data } = useMeQuery(undefined, { skip: !token });

  useEffect(() => {
    if (data) {
      dispatch(userLoaded(data));
    }
  }, [data, dispatch]);

  return <RouterProvider router={router} />;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <SessionBootstrap />
      </ToastProvider>
    </Provider>
  </StrictMode>,
);
