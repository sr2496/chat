import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
  wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: `${import.meta.env.VITE_BACKEND_URL}/broadcasting/auth`,
  withCredentials: true,

  // 🔑 Manual authorizer to send cookies + CSRF token
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        axios.post(
          options.authEndpoint,
          {
            socket_id: socketId,
            channel_name: channel.name,
          },
          {
            withCredentials: true,
            headers: {
              'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'), // send CSRF token
            },
          }
        )
        .then(response => {
          callback(null, response.data);
        })
        .catch(error => {
          callback(error, null);
        });
      },
    };
  },
});

// helper to read cookie
function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match && match[2]) {
      return decodeURIComponent(match[2]);
  }
  return '';
}
