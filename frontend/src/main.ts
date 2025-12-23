import { createApp, ref } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import './echo'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import './fontawesome'
import 'vue3-emoji-picker/css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.component('font-awesome-icon', FontAwesomeIcon).mount('#app')
