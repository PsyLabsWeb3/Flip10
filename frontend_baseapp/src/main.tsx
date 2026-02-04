import { createRoot } from 'react-dom/client';
import { Provider } from './providers/provider';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <Provider>
    <App />
  </Provider>
);
