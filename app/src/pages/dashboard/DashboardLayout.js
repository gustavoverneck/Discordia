import React, { useState } from 'react';
import '../../Global.css';
import './Dashboard.css';
import { FaUser, FaCog, FaUserFriends } from 'react-icons/fa';

export default function Dashboard() {
  const servers = [
    { id: 1, name: 'Servidor A' },
    { id: 2, name: 'Servidor B' },
    { id: 3, name: 'Servidor C' },
  ];

  const channels = {
    1: [{ id: 1, name: '#geral' }, { id: 2, name: '#projetos' }, { id: 3, name: '#off-topic' }],
    2: [{ id: 4, name: '#news' }, { id: 5, name: '#chat' }],
    3: [{ id: 6, name: '#random' }],
  };

  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'friends', 'profile', 'settings'

  const handleServerClick = (serverId) => {
    setSelectedServerId(serverId);
    setSelectedChannelId(null);
    setView('server');
  };

  const handleChannelClick = (channelId) => {
    setSelectedChannelId(channelId);
    setView('channel');
  };

  const handleFriendsClick = () => {
    setView('friends');
    setSelectedServerId(null);
    setSelectedChannelId(null);
  };

  const handleProfileClick = () => {
    setView('profile');
    setSelectedServerId(null);
    setSelectedChannelId(null);
  };

  const handleSettingsClick = () => {
    setView('settings');
    setSelectedServerId(null);
    setSelectedChannelId(null);
  };

  // Exemplo simples de mensagens para cada canal, para ilustrar
  const messagesByChannel = {
    1: [{ user: 'Fulano', text: 'Olá, bem-vindo ao Discordia!' }, { user: 'Beltrano', text: 'Bora codar!' }],
    2: [{ user: 'Ciclano', text: 'Projeto avançando!' }],
    3: [{ user: 'Fulano', text: 'Off-topic aqui!' }],
    4: [{ user: 'Outro', text: 'Notícias fresquinhas!' }],
    5: [{ user: 'Alguém', text: 'Vamos conversar!' }],
    6: [{ user: 'Random', text: 'Conteúdo aleatório' }],
  };

  // Exemplo simples lista de amigos
  const friends = [
    { id: 1, name: 'Amigo 1' },
    { id: 2, name: 'Amigo 2' },
    { id: 3, name: 'Amigo 3' },
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Discordia</h2>
        <nav>
          {servers.map((server) => (
            <div
              key={server.id}
              className={`server ${selectedServerId === server.id ? 'active' : ''}`}
              onClick={() => handleServerClick(server.id)}
              style={{ cursor: 'pointer' }}
            >
              {server.name}
            </div>
          ))}
        </nav>
        <hr />
        <button onClick={handleFriendsClick} title="Amigos">
          <FaUserFriends size={20} />
        </button>
        <div className="profile-settings">
          <button onClick={handleProfileClick} title="Perfil">
            <FaUser size={20} />
          </button>
          <button onClick={handleSettingsClick} title="Configurações">
            <FaCog size={20} />
          </button>
        </div>
      </aside>

      <main className="main">
        {view === 'home' && (
          <div className="home-screen">
            <h1>Bem-vindo ao Discordia!</h1>
            <p>Selecione um servidor ou um menu para começar.</p>
          </div>
        )}

        {view === 'friends' && (
          <div className="friends-list">
            <h1>Amigos</h1>
            <ul>
              {friends.map((friend) => (
                <li key={friend.id}>{friend.name}</li>
              ))}
            </ul>
          </div>
        )}

        {view === 'profile' && (
          <div className="profile-view">
            <h1>Perfil do Usuário</h1>
            {/* Aqui você coloca o conteúdo do perfil */}
          </div>
        )}

        {view === 'settings' && (
          <div className="settings-view">
            <h1>Configurações</h1>
            {/* Conteúdo das configurações */}
          </div>
        )}

        {view === 'server' && selectedServerId && (
          <div className="channels-list">
            <h1>Servidor: {servers.find((s) => s.id === selectedServerId).name}</h1>
            <ul>
              {channels[selectedServerId].map((channel) => (
                <li
                  key={channel.id}
                  className={selectedChannelId === channel.id ? 'active' : ''}
                  onClick={() => handleChannelClick(channel.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {channel.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {view === 'channel' && selectedChannelId && (
          <div className="channel-chat">
            <header className="header">
              <h1>{channels[selectedServerId].find((c) => c.id === selectedChannelId).name}</h1>
            </header>

            <section className="chat">
              {messagesByChannel[selectedChannelId] && messagesByChannel[selectedChannelId].length > 0 ? (
                messagesByChannel[selectedChannelId].map((msg, idx) => (
                  <div key={idx} className="message">
                    <strong>{msg.user}:</strong> {msg.text}
                  </div>
                ))
              ) : (
                <p>Nenhuma mensagem neste canal.</p>
              )}
            </section>

            <footer className="chat-input">
              <input type="text" placeholder="Escreva sua mensagem..." />
              <button>Enviar</button>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
