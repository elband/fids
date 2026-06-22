import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Offline resilience layar publik (audit M-02): cache respons API + fallback luring.
import { installOfflineCache } from '@/lib/offlineCache';
installOfflineCache();
