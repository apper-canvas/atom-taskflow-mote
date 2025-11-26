import { toast as reactToastify, ToastContainer } from 'react-toastify';

// Create toast utility with consistent configuration
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

export { toast, ToastContainer };
export default toast;