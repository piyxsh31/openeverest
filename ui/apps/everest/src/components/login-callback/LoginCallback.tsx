import { useEffect } from 'react';
import { useAuth } from 'oidc-react';

const LoginCallback = () => {
  const { userManager } = useAuth();
  useEffect(() => {
    const processLogin = async () => {
      try {
        const user = await userManager.signinCallback();

        if (user && user.id_token) {
          localStorage.setItem('everestToken', user.id_token);
          window.location.href = '/';
        }
      } catch (error) {
        return;
      }
    };
    processLogin();
  }, [userManager]);

  return null;
};

export default LoginCallback;
