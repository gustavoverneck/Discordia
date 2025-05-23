// src/components/modals/CreateChannelModal.js
import React, { useState } from 'react';
// import './CreateChannelModal.css'; // Crie este CSS

export function CreateChannelModal({ serverId, onClose, onChannelCreated }) {
  const [channelName, setChannelName] = useState('');
  const [channelType, setChannelType] = useState('TEXT'); // 'TEXT' ou 'VOICE'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError('O nome do canal é obrigatório.');
      return;
    }
    setIsLoading(true);
    setError('');
    const token = localStorage.getItem('authToken');
    // ... (verificação de token) ...

    try {
      const response = await fetch(`http://localhost:5000/servers/${serverId}/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelName: channelName.trim(), channelType }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || 'Falha ao criar canal.'); }
      if (onChannelCreated) { onChannelCreated(data); }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} disabled={isLoading}>×</button>
        <h2>Criar Canal</h2>
        {error && <div className="modal-feedback error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="channelNameModalInput">NOME DO CANAL</label>
            <input
              type="text"
              id="channelNameModalInput"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="# novo-canal"
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="channelTypeModalInput">TIPO DE CANAL</label>
            <select
              id="channelTypeModalInput"
              value={channelType}
              onChange={(e) => setChannelType(e.target.value)}
              disabled={isLoading}
            >
              <option value="TEXT">Canal de Texto</option>
              <option value="VOICE">Canal de Voz</option>
            </select>
          </div>
          <div className="form-actions modal-actions">
            <button type="button" className="button-secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}