const API_URL = 'http://localhost:3001/api';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'admin' | 'student';
  };
}

export const api = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to login');
    }

    return response.json();
  },

  async getCurrentUser(token: string) {
    const response = await fetch(`${API_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  },
}; 