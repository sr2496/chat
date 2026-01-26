import Swal from 'sweetalert2'

const colors = {
    primary: '#3B82F6', // Blue-500
    danger: '#EF4444',  // Red-500
    success: '#10B981', // Emerald-500
    warning: '#F59E0B'  // Amber-500
}

export const confirmDelete = async (title = 'Are you sure?', text = "You won't be able to revert this!") => {
    return Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: colors.danger,
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!',
        customClass: {
            popup: 'dark:bg-gray-800 dark:text-gray-100 rounded-2xl',
            title: 'dark:text-white',
            htmlContainer: 'dark:text-gray-300'
        }
    })
}

export const showSuccess = (title = 'Success!', text = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: colors.primary,
        timer: 2000,
        timerProgressBar: true,
        customClass: {
            popup: 'dark:bg-gray-800 dark:text-gray-100 rounded-2xl',
            title: 'dark:text-white',
            htmlContainer: 'dark:text-gray-300'
        }
    })
}

export const showError = (title = 'Error!', text = 'Something went wrong.') => {
    return Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: colors.primary,
        customClass: {
            popup: 'dark:bg-gray-800 dark:text-gray-100 rounded-2xl',
            title: 'dark:text-white',
            htmlContainer: 'dark:text-gray-300'
        }
    })
}

export default {
    confirmDelete,
    showSuccess,
    showError
}
