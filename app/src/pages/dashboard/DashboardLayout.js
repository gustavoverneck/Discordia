import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import '../../Global.css'; // Certifique-se que o caminho está correto
import './Dashboard.css';  // Certifique-se que o caminho está correto
import { FaUser, FaCog, FaUserFriends, FaHome } from 'react-icons/fa';

// Importe seus componentes de view (ajuste os caminhos!)
import HomeView from './HomeView';
import FriendsView from '../friends/FriendsView';
import SettingsView from '../settings/SettingsView';
import { Profile } from '../profile/Profile';


export default function DashboardLayout({ section }) {
  const navigate = useNavigate(); // Hook para navegação programática

  // Dados de exemplo (mantenha seus dados reais aqui)
  const servers = [
    { id: 1, name: 'Servidor Alpha', icon: 'A' },
    { id: 2, name: 'Universo Beta', icon: '🚀' },
    { id: 3, name: 'Projeto Gamma', icon: 'G' },
  ];
  const channels = {
    1: [{ id: 1, name: '#geral' }, { id: 2, name: '#anúncios' }],
    2: [{ id: 4, name: '#jogos' }],
    3: [{ id: 6, name: '#design' }],
  };
  const messagesByChannel = {
    1: [{ user: 'Alice', text: 'Olá!' }],
  };

  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [view, setView] = useState('home');

  useEffect(() => {
  console.log('[DashboardLayout useEffect] Section da URL (prop):', section);

  if (section === 'profile') {
    setView('profile');
  } else if (section === 'settings') {
    setView('settings');
  } else if (section === 'friends') {
    setView('friends');
  } else if (section === 'home') {
    setView('home');
  } else if (section) {
    
    console.warn(`[DashboardLayout useEffect] Seção da URL desconhecida: '${section}'. Redirecionando para a home do dashboard.`);
    navigate('/dashboard', { replace: true });
    setView('home');
  }
}, [section, navigate]);

  const navigateToView = (newView, pathSuffix = '') => {
    setView(newView);
    setSelectedServerId(null);
    setSelectedChannelId(null);
    // Atualiza a URL para refletir a view, se desejado
    // Isso é opcional e depende de como você quer que as URLs funcionem
    if (newView === 'home') {
        navigate('/dashboard');
    } else if (pathSuffix) {
        navigate(`/dashboard/${pathSuffix}`);
    } else {
        navigate(`/dashboard/${newView}`);
    }
  };

  const resetToHome = () => {
    navigateToView('home', ''); // Navega para /dashboard
  };

  const handleServerClick = (serverId) => {
    setView('server');
    setSelectedServerId(serverId);
    setSelectedChannelId(null);
    // A URL pode continuar /dashboard ou mudar para /dashboard/servers/{serverId}
    // Por simplicidade, não mudaremos a URL principal aqui, apenas o estado interno.
  };

  const handleChannelClick = (channelId) => {
    setView('channel');
    setSelectedChannelId(channelId);
    // Similar ao serverClick, a URL principal pode não mudar.
  };

  const handleDiscordiaIconClick = () => {
    resetToHome();
  };

  const handleFriendsClick = () => {
    navigateToView('friends', 'friends');
  };

  const handleProfileButtonClick = () => {
    navigateToView('profile', 'profile');
  };

  const handleSettingsClick = () => {
    navigateToView('settings', 'settings');
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div
          className="discordia-home-icon server-icon"
          onClick={handleDiscordiaIconClick}
          title="Página Inicial"
        >
          <FaHome size={24} />
        </div>
        <hr className="sidebar-divider" />
        <nav className="server-list">
          {servers.map((server) => (
            <div
              key={server.id}
              className={`server-icon ${selectedServerId === server.id ? 'active' : ''}`}
              onClick={() => handleServerClick(server.id)}
              title={server.name}
            >
              {server.iconUrl ? <img src={server.iconUrl} alt={server.name} /> : server.icon}
            </div>
          ))}
        </nav>
        <div className="utility-buttons">
          <button onClick={handleFriendsClick} title="Amigos" className="sidebar-button">
            <FaUserFriends size={20} />
          </button>
          <button onClick={handleProfileButtonClick} title="Perfil" className="sidebar-button">
            <FaUser size={20} />
          </button>
          <button onClick={handleSettingsClick} title="Configurações" className="sidebar-button">
            <FaCog size={20} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {view === 'home' && <HomeView />}
        {view === 'friends' && <FriendsView />}
        {view === 'settings' && <SettingsView />}
        {view === 'profile' && <Profile />} {/* Componente Profile para a view de perfil */}
        
        {selectedServerId && view === 'server' && (
          <div className="server-content">
            <aside className="channel-sidebar">
              <h3>{servers.find((s) => s.id === selectedServerId)?.name}</h3>
              <ul className="channels-list-items">
                {channels[selectedServerId]?.map((channel) => (
                  <li
                    key={channel.id}
                    className={`channel-item ${selectedChannelId === channel.id ? 'active' : ''}`}
                    onClick={() => handleChannelClick(channel.id)}
                  >
                    {channel.name}
                  </li>
                ))}
              </ul>
            </aside>
            <div className="content-view channel-placeholder">
              <p>Selecione um canal para ver as mensagens.</p>
            </div>
          </div>
        )}
        {selectedChannelId && view === 'channel' && (
           <div className="content-view channel-chat-view">
            <header className="chat-header">
              <h3>{channels[selectedServerId]?.find((c) => c.id === selectedChannelId)?.name}</h3>
            </header>
            <section className="chat-messages">
              {messagesByChannel[selectedChannelId] && messagesByChannel[selectedChannelId].length > 0 ? (
                messagesByChannel[selectedChannelId].map((msg, idx) => (
                  <div key={idx} className="message">
                    <strong>{msg.user}:</strong> {msg.text}
                  </div>
                ))
              ) : (
                <p className="no-messages">Nenhuma mensagem neste canal.</p>
              )}
            </section>
            <footer className="chat-input-area">
              <input type="text" placeholder={`Conversar em ${channels[selectedServerId]?.find((c) => c.id === selectedChannelId)?.name || 'canal'}`} />
              <button>Enviar</button>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}