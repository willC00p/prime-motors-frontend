import {api} from './api';

export async function fetchRotatingPassword() {
  const res = await api.get('/auth/rotating-password');
  return res.password;
}
