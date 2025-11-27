import { ToastContainer, toast as reactToastify } from "react-toastify";
import React from "react";

const toast = {
  success: (message, options = {}) => {
    return reactToastify.success(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  error: (message, options = {}) => {
    return reactToastify.error(message, {
      position: "top-right", 
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  info: (message, options = {}) => {
    return reactToastify.info(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  warning: (message, options = {}) => {
    return reactToastify.warn(message, {
      position: "top-right",
      autoClose: 4500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options
    });
  },

  // Direct access to react-toastify methods for advanced usage
  dismiss: reactToastify.dismiss,
  isActive: reactToastify.isActive,
  update: reactToastify.update,
  done: reactToastify.done,
  promise: reactToastify.promise
};

// Named export for compatibility with existing imports
export const showToast = toast;

// Default export
export default toast;

// Export ToastContainer for use in main App component
export { ToastContainer };