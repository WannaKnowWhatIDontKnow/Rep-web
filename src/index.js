import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// public/index.html 파일에서 id가 'root'인 요소를 찾습니다.
const root = ReactDOM.createRoot(document.getElementById('root'));

// 찾은 'root' 요소 안에 App 컴포넌트를 그려줍니다.
// <React.StrictMode>는 개발 중에 잠재적인 문제를 발견하고 경고해주는 역할을 합니다.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
