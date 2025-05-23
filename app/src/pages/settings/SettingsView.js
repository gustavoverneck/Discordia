// src/pages/dashboard/views/SettingsView.js
import React from 'react';
import { FaCog } from 'react-icons/fa';
import './SettingsView.css'; // <<< IMPORTA O CSS

export default function SettingsView() {
  return (
    <div className="content-view settings-view">
      <h2><FaCog /> Configurações</h2>
      
      <section className="settings-section">
        <h3>Preferências de Conta</h3>
        <div>
          <label htmlFor="language-select">Idioma:</label>
          <select id="language-select" name="language">
            <option value="pt-br">Português (Brasil)</option>
            <option value="en-us">English (US)</option>
          </select>
        </div>
        {/* Outros campos como username, email (podem vir do componente Profile se for o caso) */}
      </section>

      <section className="settings-section">
        <h3>Notificações</h3>
        <label className="settings-toggle">
          <input type="checkbox" defaultChecked /> Notificações por Email
        </label>
        <label className="settings-toggle">
          <input type="checkbox" /> Notificações Push no Desktop
        </label>
        <label className="settings-toggle">
          <input type="checkbox" defaultChecked /> Sons de Notificação
        </label>
      </section>

      <section className="settings-section">
        <h3>Privacidade</h3>
        <label className="settings-toggle">
          <input type="checkbox" defaultChecked /> Permitir mensagens diretas de membros do servidor
        </label>
        {/* Mais opções de privacidade */}
        <button type="button">Salvar Preferências de Privacidade</button>
      </section>
    </div>
  );
}