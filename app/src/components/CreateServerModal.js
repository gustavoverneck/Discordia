import React, { useState, useEffect } from 'react';
import './CreateServerModal.css';

export default function CreateServerModal({ onClose, onServerCreated }) {
  const [serverName, setServerName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // Para o arquivo da imagem
  const [previewUrl, setPreviewUrl] = useState(null);     // Para a prévia da imagem
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Limpa a prévia se o arquivo for removido ou o modal fechar
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    // Cria uma URL temporária para a prévia da imagem local
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    // Limpeza: revoga a URL do objeto quando o componente desmontar ou o arquivo mudar
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validação simples de tipo e tamanho (opcional, mas recomendada)
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem (PNG, JPG, GIF).');
        setSelectedFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // Ex: Limite de 5MB
        setError('A imagem é muito grande. Máximo de 5MB.');
        setSelectedFile(null);
        return;
      }
      setError(''); // Limpa erro anterior
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serverName.trim()) {
      setError('O nome do servidor é obrigatório.');
      return;
    }
    // O arquivo do ícone é opcional

    setIsLoading(true);
    setError('');

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Autenticação necessária. Faça login novamente.');
      setIsLoading(false);
      return;
    }

    // Usar FormData para enviar arquivos e outros dados
    const formData = new FormData();
    formData.append('serverName', serverName.trim());
    if (selectedFile) {
      formData.append('iconFile', selectedFile); // 'iconFile' será o nome do campo no backend
    }

    try {
      const response = await fetch('http://localhost:5000/servers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // NÃO defina 'Content-Type': 'application/json' ao usar FormData.
          // O navegador definirá automaticamente para 'multipart/form-data' com o boundary correto.
        },
        body: formData, // Envia o objeto FormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao criar o servidor.');
      }

      // Sucesso
      if (onServerCreated) {
        onServerCreated(data); // Passa o novo servidor (com a iconUrl do backend)
      }
      // onClose(); // O onServerCreated no DashboardLayout já chama o onClose.

    } catch (err) {
      console.error("Erro ao criar servidor:", err);
      setError(err.message || 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleActualClose = () => {
    if (!isLoading) {
      onClose();
    }
  };
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-card create-server-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleActualClose} disabled={isLoading}>×</button>
        <h2>Criar seu Servidor</h2>
        <p className="modal-subtext">
          Personalize seu servidor adicionando um nome e um ícone.
        </p>
        
        {error && <div className="modal-feedback error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="serverNameModalInput">NOME DO SERVIDOR</label>
            <input
              type="text"
              id="serverNameModalInput"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Ex: Servidor de Jogos da Galera"
              required
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="iconFileModalInput">ÍCONE DO SERVIDOR (Opcional)</label>
            <input
              type="file"
              id="iconFileModalInput"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              disabled={isLoading}
              className="file-input"
            />
            {previewUrl && (
              <div className="image-preview-container">
                <p>Prévia do Ícone:</p>
                <img src={previewUrl} alt="Prévia do ícone" className="image-preview" />
              </div>
            )}
            <small className="form-hint">Escolha uma imagem (PNG, JPG, GIF, máx 5MB).</small>
          </div>

          <div className="form-actions modal-actions">
            <button type="button" className="button-secondary" onClick={handleActualClose} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}