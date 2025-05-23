import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../Global.css'; 
import './Dashboard.css';  
import { FaUser, FaCog, FaUserFriends, FaHome, FaPlus, FaVolumeUp } from 'react-icons/fa';

// Componentes de View e Modais (AJUSTE OS CAMINHOS CONFORME SUA ESTRUTURA)
import HomeView from './HomeView';
import FriendsView from '../friends/FriendsView'; 
import SettingsView from '../settings/SettingsView'; 
import { Profile } from '../profile/Profile'; 
import { CreateChannelModal } from '../../components/CreateChannelModal'; 
import CreateServerModal from '../../components/CreateServerModal'; 

export default function DashboardLayout({ section }) {
  const navigate = useNavigate();

  const [servers, setServers] = useState([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [serversError, setServersError] = useState(null);

  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  
  const [newMessage, setNewMessage] = useState('');
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null); // Ref para o container de mensagens do chat

  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [view, setView] = useState('home');

  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [chatError, setChatError] = useState('');

  const [contextMenu, setContextMenu] = useState({
    visible: false, x: 0, y: 0, serverId: null, serverName: '',
  });

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

  const fetchMessagesForChannel = useCallback(async (currentChannelId) => {
    if (!currentChannelId) {
      setMessages([]);
      return;
    }
    const currentChannel = channels.find(c => c.ID === currentChannelId);
    if (!currentChannel || currentChannel.ChannelType !== 'TEXT') {
      setMessages([]);
      setMessagesError(currentChannel ? "Este canal não é para mensagens de texto." : null);
      return;
    }
    setMessagesLoading(true);
    setMessagesError(null);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setMessagesError("Usuário não autenticado para buscar mensagens.");
      setMessagesLoading(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/channels/${currentChannelId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: "Resposta de erro não é JSON" }));
        throw new Error(errData.error || `Erro ao buscar mensagens: ${response.status}`);
      }
      const data = await response.json();
      setMessages(Array.isArray(data) ? data.reverse() : []);
    } catch (error) {
      console.error(`Erro ao buscar mensagens para canal ${currentChannelId}:`, error);
      setMessagesError(error.message || "Não foi possível carregar as mensagens.");
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [channels]);

  useEffect(() => {
    if (section === 'profile') setView('profile');
    else if (section === 'settings') setView('settings');
    else if (section === 'friends') setView('friends');
    else if (section === 'home' || !section) setView('home');
    else {
      navigate('/dashboard', { replace: true });
      setView('home');
    }
  }, [section, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.visible && event.target.closest('.server-context-menu') === null) {
        setContextMenu(prev => ({ ...prev, visible: false }));
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

  useEffect(() => {
    if (view === 'channel' && selectedChannelId) {
      const currentChannel = channels.find(c => c.ID === selectedChannelId);
      if (currentChannel && currentChannel.ChannelType === 'TEXT') {
        fetchMessagesForChannel(selectedChannelId);
        const token = localStorage.getItem('authToken');
        if (!token) { console.error("[WebSocket] Token não encontrado."); return; }
        
        const wsUrl = `ws://localhost:5000/ws/chat`;
        if (socketRef.current) socketRef.current.close();
        socketRef.current = new WebSocket(wsUrl);
        socketRef.current.onopen = () => {
          socketRef.current.send(JSON.stringify({
            type: 'join_channel',
            payload: { channelId: selectedChannelId, token: token }
          }));
        };
        socketRef.current.onmessage = (event) => {
          try {
            const messageData = JSON.parse(event.data);
            if (messageData.channelId === selectedChannelId) {
              setMessages((prevMessages) => [...prevMessages, messageData]);
            }
          } catch (e) { console.error('[WebSocket] Erro ao parsear mensagem:', e); }
        };
        socketRef.current.onerror = (error) => console.error('[WebSocket] Erro:', error);
        socketRef.current.onclose = (event) => {
          console.log(`[WebSocket] Desconectado. Code: ${event.code}, Reason: ${event.reason}`);
          socketRef.current = null;
        };
        return () => {
          if (socketRef.current) {
            socketRef.current.send(JSON.stringify({ type: 'leave_channel', payload: { channelId: selectedChannelId } }));
            socketRef.current.close();
            socketRef.current = null;
          }
        };
      } else {
        if (socketRef.current) {
          socketRef.current.close();
          socketRef.current = null;
        }
        setMessages([]);
      }
    }
  }, [view, selectedChannelId, channels, fetchMessagesForChannel]);

  // useEffect para rolar para o final do chat
  useEffect(() => {
    if (view === 'channel' && selectedChannelId && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, selectedChannelId, view]); // Roda quando as mensagens, canal ou view mudam


  const navigateToView = (newView, pathSuffix = '') => {
    setView(newView);
    if (newView !== 'server' && newView !== 'channel') {
      setSelectedServerId(null);
      setSelectedChannelId(null);
    }
    if (newView === 'home' || (!pathSuffix && newView !== 'server' && newView !== 'channel')) {
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
    setMessages([]);
    fetchChannels(serverId);
  };

  const handleChannelClick = (channelId) => {
    const channel = channels.find(c => c.ID === channelId);
    if (channel) {
      if (channel.ChannelType === 'TEXT') {
        setView('channel');
        setSelectedChannelId(channelId);
      } else if (channel.ChannelType === 'VOICE') {
        alert(`Canal de voz: ${channel.ChannelName} (funcionalidade de voz não implementada)`);
        setSelectedChannelId(channelId);
        setMessages([]);
      }
    }
  };

  const openCreateServerModal = () => setIsCreateServerModalOpen(true);
  const closeCreateServerModal = () => setIsCreateServerModalOpen(false);
  const handleServerCreated = (newServer) => { fetchServers(); closeCreateServerModal(); };

  const openCreateChannelModal = () => setIsCreateChannelModalOpen(true);
  const closeCreateChannelModal = () => setIsCreateChannelModalOpen(false);
  const handleChannelCreated = (newChannel) => { if (selectedServerId) { fetchChannels(selectedServerId); } closeCreateChannelModal(); };

  const handleServerRightClick = (event, serverId, serverName) => { event.preventDefault(); setContextMenu({ visible: true, x: event.pageX, y: event.pageY, serverId, serverName }); };
  
  const handleLeaveServer = async () => {
    if (!contextMenu.serverId) return;
    const serverIdToLeave = contextMenu.serverId;
    const serverName = contextMenu.serverName;
    const currentSelectedServer = selectedServerId;
    setContextMenu({ ...contextMenu, visible: false });
    const token = localStorage.getItem('authToken');
    if (!token) { alert('Autenticação necessária.'); return; }
    try {
      const response = await fetch(`http://localhost:5000/servers/${serverIdToLeave}/members/me`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Falha ao deixar o servidor: ${response.statusText}`);
      }
      alert(`Você deixou o servidor "${serverName}" com sucesso.`);
      fetchServers();
      if (currentSelectedServer === serverIdToLeave) { resetToHome(); }
    } catch (error) { console.error("Erro ao deixar o servidor:", error); alert(`Erro: ${error.message}`); }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setChatError('');
    if (!newMessage.trim()) { return; }
    if (!selectedChannelId) { setChatError("Nenhum canal selecionado."); return; }
    if (!socketRef.current) { setChatError('Não conectado ao chat.'); return; }
    if (socketRef.current.readyState !== WebSocket.OPEN) {
      setChatError(`Conexão com o chat não está pronta (Estado: ${socketRef.current.readyState}).`);
      return;
    }
    const messagePayload = {
      type: 'new_message',
      payload: { channelId: selectedChannelId, content: newMessage.trim() }
    };
    try {
      socketRef.current.send(JSON.stringify(messagePayload));
      setNewMessage('');
    } catch (sendError) {
      console.error('[handleSendMessage] ERRO ao tentar enviar mensagem via WebSocket:', sendError);
      setChatError('Falha ao enviar a mensagem.');
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="discordia-home-icon server-icon" onClick={handleHomeIconClick} title="Página Inicial" > <FaHome size={24} /> </div>
        <hr className="sidebar-divider" />
        <nav className="server-list">
          {serversLoading && <p style={{color: 'white', fontSize: '0.8em', textAlign: 'center'}}>Carregando...</p>}
          {serversError && <p style={{color: 'red', fontSize: '0.8em', padding: '0 5px', textAlign: 'center'}}>{serversError}</p>}
          {!serversLoading && !serversError && Array.isArray(servers) && servers.length === 0 && ( <p style={{color: '#8e9297', fontSize: '0.8em', textAlign: 'center', padding: '10px'}}>Nenhum servidor<br/>ainda.</p> )}
          {!serversLoading && !serversError && Array.isArray(servers) && servers.map((server) => (
            <div key={server.id} className={`server-icon ${selectedServerId === server.id ? 'active' : ''}`} onClick={() => handleServerClick(server.id)} onContextMenu={(e) => handleServerRightClick(e, server.id, server.name)} title={server.name} >
              {server.iconUrl ? (<img src={`http://localhost:5000${server.iconUrl}`} alt={server.name} />) : (server.name ? server.name.charAt(0).toUpperCase() : 'S')}
            </div>
          ))}
          <div className="server-icon add-server-button" onClick={openCreateServerModal} title="Adicionar um Servidor" > <FaPlus size={20} /> </div>
        </nav>
        <hr className="sidebar-divider" />
        <div className="utility-buttons">
          <button onClick={handleFriendsClick} title="Amigos" className="sidebar-button"><FaUserFriends size={20} /></button>
          <button onClick={handleProfileButtonClick} title="Perfil" className="sidebar-button"><FaUser size={20} /></button>
          <button onClick={handleSettingsClick} title="Configurações" className="sidebar-button"><FaCog size={20} /></button>
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
                <button onClick={openCreateChannelModal} className="add-channel-button" title="Criar Canal"> <FaPlus size={16}/> </button>
              </div>
              {channelsLoading && <p className="loading-text" style={{padding: '10px', textAlign:'center', fontSize: '0.8em'}}>Carregando canais...</p>}
              {channelsError && <p className="error-text" style={{padding: '10px', color: 'red', textAlign:'center', fontSize: '0.8em'}}>{channelsError}</p>}
              {!channelsLoading && !channelsError && Array.isArray(channels) && (
                <ul className="channels-list-items">
                  {channels.filter(c => c.ChannelType === 'TEXT').length > 0 && (<li className="channel-category">CANAIS DE TEXTO</li>)}
                  {channels.filter(c => c.ChannelType === 'TEXT').map((channel) => (
                    <li key={channel.ID} className={`channel-item text-channel ${selectedChannelId === channel.ID ? 'active' : ''}`} onClick={() => handleChannelClick(channel.ID)}>
                      <span className="channel-icon">#</span>{channel.ChannelName}
                    </li>
                  ))}
                  {channels.filter(c => c.ChannelType === 'VOICE').length > 0 && (<li className="channel-category">CANAIS DE VOZ</li>)}
                  {channels.filter(c => c.ChannelType === 'VOICE').map((channel) => (
                    <li key={channel.ID} className={`channel-item voice-channel ${selectedChannelId === channel.ID ? 'active' : ''}`} onClick={() => handleChannelClick(channel.ID)}>
                       <FaVolumeUp className="channel-icon" /> {channel.ChannelName}
                    </li>
                  ))}
                   {!channelsLoading && !channelsError && channels.length === 0 && (<li className="no-channels-message" style={{padding: '10px', color: '#8e9297', fontSize: '0.9em'}}>Nenhum canal criado.</li>)}
                </ul>
              )}
            </aside>
            
            {view === 'server' && !selectedChannelId && ( <div className="content-view channel-placeholder"><p>Selecione um canal para começar a conversar!</p></div> )}
            
            {view === 'channel' && selectedChannelId && (
                <div className="content-view channel-chat-view">
                     <header className="chat-header">
                        <h3> {channels.find(c => c.ID === selectedChannelId)?.ChannelName} </h3>
                     </header>
                     <section className="chat-messages" ref={chatContainerRef}>
                        {messagesLoading && <p className="loading-text">Carregando mensagens...</p>}
                        {messagesError && <p className="error-text">{messagesError}</p>}
                        {!messagesLoading && !messagesError && Array.isArray(messages) && messages.length > 0 ? (
                            messages.map((msg) => (
                            <div key={msg.id} className="message">
                                <div className="message-author-avatar">
                                {msg.author && msg.author.avatarUrl ? (
                                    <img src={msg.author.avatarUrl.startsWith('http') ? msg.author.avatarUrl : `http://localhost:5000${msg.author.avatarUrl}`} alt={msg.author.username} />
                                ) : (
                                    <div className="avatar-placeholder">
                                    {msg.author && msg.author.username ? msg.author.username.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                                </div>
                                <div className="message-content">
                                <div className="message-header">
                                    <strong className="message-author-name">{msg.author?.username || 'Usuário Desconhecido'}</strong>
                                    <span className="message-timestamp">
                                    {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="message-text">{msg.content}</div>
                                </div>
                            </div>
                            ))
                        ) : (
                            !messagesLoading && !messagesError && <p className="no-messages">Nenhuma mensagem neste canal ainda. Seja o primeiro!</p>
                        )}
                        </section>
                        <footer className="chat-input-area">
                          <form className="chat-input-area_form" onSubmit={handleSendMessage}>
                            <input 
                              type="text" 
                              placeholder={`Conversar em #${channels.find(c => c.ID === selectedChannelId)?.ChannelName || 'canal'}`} 
                              value={newMessage}
                              onChange={(e) => {
                                setNewMessage(e.target.value);
                                if (chatError) setChatError('');
                              }}
                            />
                            <button type="submit">Enviar</button>
                          </form>
                          {chatError && <p className="error-message" style={{textAlign: 'center', padding: '5px 16px 0 16px', fontSize: '0.8em'}}>{chatError}</p>}
                        </footer>
                </div>
            )}
          </div>
        )}
      </main>

      {isCreateServerModalOpen && ( <CreateServerModal onClose={closeCreateServerModal} onServerCreated={handleServerCreated} /> )}
      {isCreateChannelModalOpen && selectedServerId && ( <CreateChannelModal serverId={selectedServerId} onClose={closeCreateChannelModal} onChannelCreated={handleChannelCreated} /> )}
      
      {contextMenu.visible && ( 
        <div 
          className="server-context-menu" 
          style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
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
