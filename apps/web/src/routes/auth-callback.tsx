import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useDispatch } from 'react-redux';
import { Spinner } from '../components/ui/spinner';
import { tokenReceived } from '../store/auth.slice';

export const AuthCallbackPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = new URLSearchParams(
      window.location.hash.replace(/^#/, ''),
    ).get('token');

    if (token) {
      dispatch(tokenReceived(token));
      window.history.replaceState(null, '', window.location.pathname);
      navigate({ to: '/documents' });
      return;
    }

    navigate({ to: '/login' });
  }, [dispatch, navigate]);

  return (
    <div className="grid min-h-dvh place-items-center text-ink-soft">
      <Spinner />
    </div>
  );
};
