/**
 * Login Page
 * Authentication page with login form
 */

import LoginForm from '../components/LoginForm';

const Login = ({ onLogin }) => {
  return <LoginForm onLogin={onLogin} />;
};

export default Login;
