import { writable } from 'svelte/store';

// Store cho user hiện tại
export const currentUser = writable(null);

// Store cho trạng thái loading
export const isLoading = writable(false);

// Auth actions
export const authStore = {
  login: (user) => {
    currentUser.set(user);
    // Lưu thông tin người dùng vào localStorage mà không có thời hạn
    localStorage.setItem('currentUser', JSON.stringify(user));
  },
  
  logout: () => {
    currentUser.set(null);
    localStorage.removeItem('currentUser');
  },
  
  updateUser: (userData) => {
    currentUser.update(user => ({ ...user, ...userData }));
    const updatedUser = JSON.parse(localStorage.getItem('currentUser'));
    localStorage.setItem('currentUser', JSON.stringify({ ...updatedUser, ...userData }));
  },
  
  checkAuth: () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        currentUser.set(user);
        return user;
      } catch (error) {
        console.error('Lỗi parse user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
    return null;
  }
};

// Helper functions
export const isAdmin = (user) => {
  return user && user.isAdmin === true;
};

export const isLoggedIn = (user) => {
  return user !== null;
};