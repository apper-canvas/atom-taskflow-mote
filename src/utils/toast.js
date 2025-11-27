import { toast as reactToastify, ToastContainer } from 'react-toastify'

const toast = (message, type = 'info', options = {}) => {
  switch (type) {
    case 'success':
      return reactToastify.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      })
    case 'error':
      return reactToastify.error(message, {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      })
    case 'warning':
      return reactToastify.warning(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      })
    case 'info':
    default:
      return reactToastify.info(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        ...options
      })
  }
}

// Named export for compatibility with existing imports
export const showToast = toast

// Default export
export default toast

// Export ToastContainer for use in main App component
export { ToastContainer }
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