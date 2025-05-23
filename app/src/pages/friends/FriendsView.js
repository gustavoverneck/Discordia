// src/pages/dashboard/views/FriendsView.js
import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaPlus, FaSearch } from 'react-icons/fa';
import './FriendsView.css'; // Criaremos este arquivo CSS a seguir

const mockFriendsData = {
  all: [
    { id: '1', name: 'AliceWonder', tag: '1234', status: 'online', avatarUrl: 'https://i.pravatar.cc/40?u=alice' },
    { id: '2', name: 'BobTheBuilder', tag: '5678', status: 'idle', avatarUrl: 'https://i.pravatar.cc/40?u=bob' },
    { id: '3', name: 'CharlieBrown', tag: '9012', status: 'dnd', avatarUrl: 'https://i.pravatar.cc/40?u=charlie' },
    { id: '4', name: 'DianaPrince', tag: '3456', status: 'offline', avatarUrl: 'https://i.pravatar.cc/40?u=diana' },
    { id: '5', name: 'EdwardScissor', tag: '7890', status: 'online', avatarUrl: 'https://i.pravatar.cc/40?u=edward' },
  ],
  pending: [
    { id: '6', name: 'FrankCastle', tag: '1122', type: 'incoming', avatarUrl: 'https://i.pravatar.cc/40?u=frank' },
    { id: '7', name: 'GraceHopper', tag: '3344', type: 'outgoing', avatarUrl: 'https://i.pravatar.cc/40?u=grace' },
  ],
  blocked: [
     { id: '8', name: 'BlockedUser', tag: '0000', avatarUrl: 'https://i.pravatar.cc/40?u=blocked' },
  ]
};

const FriendStatusIndicator = ({ status }) => {
  let color;
  switch (status) {
    case 'online':
      color = '#43b581'; // Verde
      break;
    case 'idle':
      color = '#faa61a'; // Amarelo/Laranja
      break;
    case 'dnd': // Do Not Disturb
      color = '#f04747'; // Vermelho
      break;
    case 'offline':
    default:
      color = '#747f8d'; // Cinza
      break;
  }
  return <span className="status-indicator" style={{ backgroundColor: color }} title={status}></span>;
};


export default function FriendsView() {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'online', 'pending', 'blocked'
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [addFriendInput, setAddFriendInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Simular carregamento de dados
  useEffect(() => {
    // Aqui você faria chamadas de API para buscar os dados reais
    setFriends(mockFriendsData.all);
    setPendingRequests(mockFriendsData.pending);
    setBlockedUsers(mockFriendsData.blocked);
  }, []);

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (addFriendInput.trim() === '') return;
    // Lógica para enviar pedido de amizade (ex: POST /api/friends/request)
    alert(`Pedido de amizade enviado para: ${addFriendInput}`);
    setAddFriendInput('');
  };

  const getVisibleFriends = () => {
    let listToFilter = [];
    if (activeTab === 'all') listToFilter = friends;
    if (activeTab === 'online') listToFilter = friends.filter(f => f.status === 'online');
    // Para 'pending' e 'blocked', usaremos listas separadas
    
    if(searchTerm.trim() !== '' && (activeTab === 'all' || activeTab === 'online')){
        return listToFilter.filter(friend => 
            friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            friend.tag.includes(searchTerm)
        );
    }
    return listToFilter;
  };
  
  const visibleFriends = getVisibleFriends();

  const renderFriendList = (list) => {
    if (list.length === 0 && searchTerm.trim() !== '') {
        return <p className="no-friends-message">Nenhum amigo encontrado para "{searchTerm}".</p>;
    }
    if (list.length === 0) {
      let message = "Você não tem amigos nesta categoria ainda.";
      if(activeTab === 'online') message = "Nenhum amigo online no momento.";
      return <p className="no-friends-message">{message}</p>;
    }
    return list.map(friend => (
      <div key={friend.id} className="friend-item">
        <div className="friend-info">
          <img src={friend.avatarUrl || `https://i.pravatar.cc/40?u=${friend.id}`} alt={friend.name} className="friend-avatar" />
          <div>
            <span className="friend-name">{friend.name}</span>
            <span className="friend-tag">#{friend.tag}</span>
          </div>
          <FriendStatusIndicator status={friend.status} />
        </div>
        <div className="friend-actions">
          {/* Placeholder para botões de ação */}
          <button title="Conversar">💬</button>
          <button title="Mais Opções">⋮</button>
        </div>
      </div>
    ));
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) {
      return <p className="no-friends-message">Nenhum pedido de amizade pendente.</p>;
    }
    return pendingRequests.map(req => (
      <div key={req.id} className="friend-item pending-request">
        <div className="friend-info">
           <img src={req.avatarUrl || `https://i.pravatar.cc/40?u=${req.id}`} alt={req.name} className="friend-avatar" />
          <div>
            <span className="friend-name">{req.name}</span>
            <span className="friend-tag">#{req.tag}</span>
            <span className="pending-type">
                {req.type === 'incoming' ? '(Pedido Recebido)' : '(Pedido Enviado)'}
            </span>
          </div>
        </div>
        <div className="friend-actions">
          {req.type === 'incoming' && (
            <>
              <button title="Aceitar" className="action-accept">✔️</button>
              <button title="Recusar/Cancelar" className="action-decline">❌</button>
            </>
          )}
          {req.type === 'outgoing' && (
            <button title="Cancelar Pedido" className="action-decline">❌</button>
          )}
        </div>
      </div>
    ));
  };

   const renderBlockedUsers = () => {
    if (blockedUsers.length === 0) {
      return <p className="no-friends-message">Você não bloqueou ninguém.</p>;
    }
    return blockedUsers.map(user => (
      <div key={user.id} className="friend-item blocked-user">
        <div className="friend-info">
           <img src={user.avatarUrl || `https://i.pravatar.cc/40?u=${user.id}`} alt={user.name} className="friend-avatar" />
          <div>
            <span className="friend-name">{user.name}</span>
            <span className="friend-tag">#{user.tag}</span>
          </div>
        </div>
        <div className="friend-actions">
            <button title="Desbloquear" className="action-decline">❌</button>
        </div>
      </div>
    ));
  };


  return (
    <div className="content-view friends-view">
      <header className="friends-header">
        <div className="title-area">
          <FaUserFriends size={24} className="header-icon" />
          <h1>Amigos</h1>
        </div>
        <nav className="friends-tabs">
          <button onClick={() => setActiveTab('online')} className={activeTab === 'online' ? 'active' : ''}>Online</button>
          <button onClick={() => setActiveTab('all')} className={activeTab === 'all' ? 'active' : ''}>Todos</button>
          <button onClick={() => setActiveTab('pending')} className={activeTab === 'pending' ? 'active' : ''}>Pendentes</button>
          <button onClick={() => setActiveTab('blocked')} className={activeTab === 'blocked' ? 'active' : ''}>Bloqueados</button>
          <button className="add-friend-btn-header" onClick={() => document.getElementById('add-friend-input-main')?.focus()}>
            <FaPlus /> Adicionar Amigo
          </button>
        </nav>
      </header>

      {activeTab !== 'pending' && activeTab !== 'blocked' && (
        <div className="add-friend-section">
            <form onSubmit={handleAddFriend}>
            <input
                type="text"
                id="add-friend-input-main"
                value={addFriendInput}
                onChange={(e) => setAddFriendInput(e.target.value)}
                placeholder="Adicionar amigo com NomeDeUsuário#tag"
            />
            <button type="submit">Enviar pedido de amizade</button>
            </form>
        </div>
      )}


      {(activeTab === 'all' || activeTab === 'online') && (
        <div className="search-friends-section">
            <input 
                type="text"
                placeholder="Buscar amigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {/* <FaSearch className="search-icon"/>  // Opcional: ícone dentro do input */}
        </div>
      )}

      <div className="friends-list-container">
        {activeTab === 'online' && renderFriendList(visibleFriends)}
        {activeTab === 'all' && renderFriendList(visibleFriends)}
        {activeTab === 'pending' && renderPendingRequests()}
        {activeTab === 'blocked' && renderBlockedUsers()}
      </div>
    </div>
  );
}