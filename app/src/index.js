import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Seus imports de CSS globais
import './Global.css'; // Exemplo, se você tiver um Global.css na raiz do src/

// Seus componentes de página/tela
import LoginScreen from './pages/login/Login';
import RegisterScreen from './pages/login/Register';
import DashboardLayout from './pages/dashboard/DashboardLayout'; // Nome mais explícito se for um layout

import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Renderize sua aplicação APENAS UMA VEZ com a configuração de rotas
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<LoginScreen />} />
        <Route path="/login" element={<LoginScreen />} /> {/* Opcional: rota explícita para login */}
        <Route path="/register" element={<RegisterScreen />} />

        {/* Rotas que podem ser protegidas ou levar a conteúdo protegido */}
        {/* A proteção de rotas (ex: verificar se o usuário está logado antes de acessar /dashboard)
            geralmente é feita dentro do DashboardLayout ou usando um componente de Rota Protegida.
            Este index.js apenas define a estrutura de navegação. */}
        <Route path="/dashboard" element={<DashboardLayout />} />
        <Route path="/dashboard/settings" element={<DashboardLayout section="settings" />} />
        <Route path="/dashboard/profile" element={<DashboardLayout section="profile" />} />
        <Route path="/dashboard/friends" element={<DashboardLayout section="friends" />} />
        
        {/* Você pode adicionar uma rota catch-all para páginas não encontradas (404) aqui se desejar */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();