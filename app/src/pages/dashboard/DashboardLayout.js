import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Global.css'; // Ajuste se necessário
import './Dashboard.css';  // Ajuste se necessário
import { FaUser, FaCog, FaUserFriends, FaHome, FaPlus, FaVolumeUp } from 'react-icons/fa'; // FaPlus já está aqui

// Componentes de View (ajuste os caminhos)
import HomeView from '../dashboard/HomeView';
import FriendsView from '../friends/FriendsView';
import SettingsView from '../settings/SettingsView';
import { Profile } from '../profile/Profile';
import { CreateChannelModal } from '../../components/CreateChannelModal';
import CreateServerModal from '../../components/CreateServerModal';


export default function DashboardLayout({ section }) {
  const navigate = useNavigate();

  // Estados para servidores
  const [servers, setServers] = useState([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [serversError, setServersError] = useState(null);

  // Estados para canais do servidor selecionado
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState(null);

  // Estados de seleção e view
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [view, setView] = useState('home');

  // Estados de controle dos modais
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);

  // Estado do menu de contexto
  const [contextMenu, setContextMenu] = useState({
    visible: false, x: 0, y: 0, serverId: null, serverName: '',
  });

  // Mock data para mensagens (substitua quando implementar o backend para mensagens)
  const messagesByChannel = {
    1: [{ user: 'Usuário1', text: 'Bem-vindo ao #geral!' }],
  };


  const fetchServers = useCallback(async () => {
    setServersLoading(true);
    setServersError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setServersError("Usuário não autenticado.");
      setServersLoading(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/users/me/servers', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Resposta de erro não é JSON" }));
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      setServers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Falha ao buscar servidores:", error);
      setServersError(error.message || "Não foi possível carregar os servidores.");
      setServers([]);
    } finally {
      setServersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const fetchChannels = useCallback(async (currentServerId) => {
    if (!currentServerId) {
      setChannels([]);
      return;
    }
    setChannelsLoading(true);
    setChannelsError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setChannelsError("Usuário não autenticado para buscar canais.");
      setChannelsLoading(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/servers/${currentServerId}/channels`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Resposta de erro não é JSON" }));
        throw new Error(errData.error || `Erro ao buscar canais: ${response.status}`);
      }
      const data = await response.json();
      setChannels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(`Erro ao buscar canais para servidor ${currentServerId}:`, error);
      setChannelsError(error.message || "Não foi possível carregar os canais.");
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  }, []);


  useEffect(() => {
    if (section === 'profile') setView('profile');
    else if (section === 'settings') setView('settings');
    else if (section === 'friends') setView('friends');
    else if (section === 'home') setView('home');
    else if (section) {
      navigate('/dashboard', { replace: true });
      setView('home');
    }
  }, [section, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && event.target.closest('.server-context-menu') === null) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [contextMenu]);

  const navigateToView = (newView, pathSuffix = '') => {
    setView(newView);
    // Só reseta server/channel se não for uma navegação para server/channel view
    if (newView !== 'server' && newView !== 'channel') {
        setSelectedServerId(null);
        setSelectedChannelId(null);
    }
    if (newView === 'home' || !pathSuffix && (newView !== 'server' && newView !== 'channel')) {
      navigate(newView === 'home' ? '/dashboard' : `/dashboard/${newView}`);
    } else if (pathSuffix && (newView !== 'server' && newView !== 'channel')) {
      navigate(`/dashboard/${pathSuffix}`);
    }
  };

  const resetToHome = () => navigateToView('home', '');
  const handleHomeIconClick = () => resetToHome();
  const handleProfileButtonClick = () => navigateToView('profile', 'profile');
  const handleSettingsClick = () => navigateToView('settings', 'settings');
  const handleFriendsClick = () => navigateToView('friends', 'friends');

  const handleServerClick = (serverId) => {
    setView('server');
    setSelectedServerId(serverId);
    setSelectedChannelId(null);
    fetchChannels(serverId);
  };

  const handleChannelClick = (channelId) => {
    setView('channel');
    setSelectedChannelId(channelId);
  };

  const openCreateServerModal = () => setIsCreateServerModalOpen(true);
  const closeCreateServerModal = () => setIsCreateServerModalOpen(false);
  const handleServerCreated = (newServer) => {
    fetchServers();
    closeCreateServerModal();
    // Opcional: selecionar o novo servidor
    // handleServerClick(newServer.id); 
  };

  const openCreateChannelModal = () => setIsCreateChannelModalOpen(true);
  const closeCreateChannelModal = () => setIsCreateChannelModalOpen(false);
  const handleChannelCreated = (newChannel) => {
    if (selectedServerId) { // Garante que temos um serverId para buscar os canais
      fetchChannels(selectedServerId);
    }
    // Ou atualização otimista: setChannels(prev => [...prev, newChannel]);
    closeCreateChannelModal();
  };

  const handleServerRightClick = (event, serverId, serverName) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.pageX, y: event.pageY, serverId, serverName });
  };

  const handleLeaveServer = async () => { /* ... sua função handleLeaveServer ... */ };


  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div
          className="discordia-home-icon server-icon"
          onClick={handleHomeIconClick}
          title="Página Inicial"
        >
          <FaHome size={24} />
        </div>
        <hr className="sidebar-divider" />
        <nav className="server-list">
          {serversLoading && <p style={{color: 'white', fontSize: '0.8em', textAlign: 'center'}}>Carregando...</p>}
          {serversError && <p style={{color: 'red', fontSize: '0.8em', padding: '0 5px', textAlign: 'center'}}>{serversError}</p>}
          {!serversLoading && !serversError && Array.isArray(servers) && servers.length === 0 && (
            <p style={{color: '#8e9297', fontSize: '0.8em', textAlign: 'center', padding: '10px'}}>Nenhum servidor<br/>ainda.</p>
          )}
          {!serversLoading && !serversError && Array.isArray(servers) && servers.map((server) => (
            <div
              key={server.id}
              className={`server-icon ${selectedServerId === server.id ? 'active' : ''}`}
              onClick={() => handleServerClick(server.id)}
              onContextMenu={(e) => handleServerRightClick(e, server.id, server.name)}
              title={server.name}
            >
              {server.iconUrl ? (
                <img src={`http://localhost:5000${server.iconUrl}`} alt={server.name} />
              ) : (
                server.name ? server.name.charAt(0).toUpperCase() : 'S'
              )}
            </div>
          ))}
          <div
            className="server-icon add-server-button"
            onClick={openCreateServerModal}
            title="Adicionar um Servidor"
          >
            <FaPlus size={20} />
          </div>
        </nav>
        <hr className="sidebar-divider" />
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
        {view === 'profile' && <Profile />}
        
        {selectedServerId && (view === 'server' || view === 'channel') && (
          <div className="server-content">
            <aside className="channel-sidebar">
              <div className="channel-sidebar-header">
                <h3>{servers.find((s) => s.id === selectedServerId)?.name}</h3>
                <button onClick={openCreateChannelModal} className="add-channel-button" title="Criar Canal">
                  <FaPlus size={16}/>
                </button>
              </div>
              {channelsLoading && <p className="loading-text" style={{padding: '10px', textAlign:'center', fontSize: '0.8em'}}>Carregando canais...</p>}
              {channelsError && <p className="error-text" style={{padding: '10px', color: 'red', textAlign:'center', fontSize: '0.8em'}}>{channelsError}</p>}
              {!channelsLoading && !channelsError && (
                <ul className="channels-list-items">
                  {channels.filter(c => c.ChannelType === 'TEXT').length > 0 && (
                    <li className="channel-category">CANAIS DE TEXTO</li>
                  )}
                  {channels.filter(c => c.ChannelType === 'TEXT').map((channel) => (
                    <li
                      key={channel.ID}
                      className={`channel-item text-channel ${selectedChannelId === channel.ID ? 'active' : ''}`}
                      onClick={() => handleChannelClick(channel.ID)}
                    >
                      <span className="channel-icon"></span>{channel.ChannelName}
                    </li>
                  ))}
                  {channels.filter(c => c.ChannelType === 'VOICE').length > 0 && (
                    <li className="channel-category">CANAIS DE VOZ</li>
                  )}
                  {channels.filter(c => c.ChannelType === 'VOICE').map((channel) => (
                    <li
                      key={channel.ID}
                      className={`channel-item voice-channel ${selectedChannelId === channel.ID ? 'active' : ''}`}
                      onClick={() => handleChannelClick(channel.ID)}
                    >
                       <FaVolumeUp className="channel-icon" /> {channel.ChannelName}
                    </li>
                  ))}
                   {!channelsLoading && !channelsError && channels.length === 0 && (
                     <li className="no-channels-message" style={{padding: '10px', color: '#8e9297', fontSize: '0.9em'}}>Nenhum canal criado.</li>
                   )}
                </ul>
              )}
            </aside>
            
            {view === 'server' && !selectedChannelId && (
                 <div className="content-view channel-placeholder"><p>Selecione um canal para começar a conversar!</p></div>
            )}
            {view === 'channel' && selectedChannelId && (
                <div className="content-view channel-chat-view">
                     <header className="chat-header">
                        <h3>
                            {/* No backend, o CanalModel tem ChannelName e ChannelType, ID.  */}
                            {/* A API /servers/:serverId/channels retorna []models.Channel */}
                            {channels.find(c => c.ID === selectedChannelId)?.ChannelName}
                        </h3>
                     </header>
                     <section className="chat-messages">
                        {messagesByChannel[selectedChannelId] && messagesByChannel[selectedChannelId].length > 0 ? (
                            messagesByChannel[selectedChannelId].map((msg, idx) => (
                            <div key={idx} className="message">
                                <strong>{msg.user}:</strong> {msg.text}
                            </div>
                            ))
                        ) : (
                            <p className="no-messages">Nenhuma mensagem neste canal ainda. Seja o primeiro!</p>
                        )}
                        </section>
                        <footer className="chat-input-area">
                        <input 
                            type="text" 
                            placeholder={`Conversar em #${channels.find(c => c.ID === selectedChannelId)?.ChannelName || 'canal'}`} 
                        />
                        <button>Enviar</button>
                        </footer>
                </div>
            )}
          </div>
        )}
      </main>

      {isCreateServerModalOpen && (
        <CreateServerModal
          onClose={closeCreateServerModal}
          onServerCreated={handleServerCreated}
        />
      )}
      {isCreateChannelModalOpen && selectedServerId && (
        <CreateChannelModal
          serverId={selectedServerId}
          onClose={closeCreateChannelModal}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {contextMenu.visible && (
        <div
          className="server-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} 
        >
          <ul>
            <li onClick={handleLeaveServer} className="context-menu-option leave-option">Deixar Servidor</li>
          </ul>
        </div>
      )}
    </div>
  );
}