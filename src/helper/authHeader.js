export function authHeader() {
  const token = localStorage.getItem('accessToken');

  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    };
  } else {
    return {
      'Content-Type': 'application/json'
    };
  }
}
