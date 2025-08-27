// 테스트용 JWT 토큰 생성 및 저장 유틸리티

export const createTestToken = (userId: number = 1) => {
  // 간단한 테스트용 JWT 토큰 생성 (실제 프로덕션에서는 서버에서 생성해야 함)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    userId: userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24시간 유효
  }));
  const signature = btoa('test-signature'); // 실제로는 서버에서 서명해야 함
  
  return `${header}.${payload}.${signature}`;
};

export const setTestToken = (userId: number = 1) => {
  const token = createTestToken(userId);
  localStorage.setItem('token', token);
  console.log(`Test token set for user ${userId}:`, token);
  return token;
};

export const clearToken = () => {
  localStorage.removeItem('token');
  console.log('Token cleared');
};

export const getTokenInfo = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('No token found');
    return null;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
    return payload;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};
