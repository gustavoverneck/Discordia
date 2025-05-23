import { useEffect, useState } from 'react';
import './Profile.css';

// Função auxiliar para formatar a data
function formatDateDisplay(dateString) {
    if (!dateString) {
        console.log('[formatDateDisplay] dateString is empty or null. Returning "Data not available".');
        return 'Data not available';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        console.warn('[formatDateDisplay] Attempt to format invalid date:', dateString, '. Returning "Invalid date".');
        return 'Invalid date';
    }
    const formatted = date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    console.log(`[formatDateDisplay] Date formatted for "${dateString}": "${formatted}"`);
    return formatted;
}

// Removida a prop 'onClose', pois não é mais um modal
export function Profile() {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '' });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            setError('');
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Usuário não autenticado.');
                setIsLoading(false);
                return;
            }
            try {
                const response = await fetch('http://localhost:5000/profile', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (!response.ok) {
                    setError(data.error || 'Falha ao carregar o perfil.');
                    setProfile(null);
                } else {
                    setProfile(data);
                    setFormData({ username: data.username, email: data.email });
                }
            } catch (err) {
                console.error("Erro ao buscar perfil:", err);
                setError('Erro de conexão ao buscar perfil.');
                setProfile(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccessMessage('');
        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Sessão expirada ou inválida. Faça login novamente.');
            setIsSaving(false); return;
        }
        try {
            const response = await fetch('http://localhost:5000/profile', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Falha ao atualizar o perfil.');
            } else {
                setProfile(data);
                setFormData({ username: data.username, email: data.email });
                setIsEditing(false);
                setSuccessMessage('Perfil atualizado com sucesso!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error("Erro ao atualizar perfil:", err);
            setError('Erro de conexão ao atualizar perfil.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        if (profile && !isEditing) { // Preenche o form ao entrar no modo de edição
            setFormData({ username: profile.username, email: profile.email });
        }
        setError('');
        setSuccessMessage('');
    };

    if (isLoading) {
        return <div className="profile-container"><p>Carregando perfil...</p></div>;
    }

    if (error && !profile) { // Se houve erro e não temos perfil
         return <div className="profile-container"><div className="profile-feedback error">{error}</div></div>;
    }
    
    if (!profile) { // Se não está carregando, não deu erro, mas não tem perfil
        return <div className="profile-container"><p>Não foi possível carregar os dados do perfil.</p></div>;
    }

    // O div externo agora usa 'profile-container' ou uma classe similar para uma view normal,
    // em vez de 'profile-modal'. Os estilos em 'Perfil.css' para 'profile-card' podem ser
    // adaptados para 'profile-container' ou um novo container interno.
    return (
        <div className="profile-container"> {/* Anteriormente .profile-card, mas agora é a view principal */}
            {/* O botão de fechar é removido, pois não é mais um modal */}
            <h2>Perfil do Usuário</h2>

            {error && <div className="profile-feedback error">{error}</div>}
            {successMessage && <div className="profile-feedback success">{successMessage}</div>}

            {isEditing ? (
                <form onSubmit={handleSubmit} className="profile-form">
                    <div>
                        <label htmlFor="username">Usuário: </label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={isSaving}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email">Email: </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isSaving}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <p><strong>Membro desde:</strong> {formatDateDisplay(profile.createdAt)}</p>
                        <button type="submit" disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button type="button" onClick={handleEditToggle} disabled={isSaving}>
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <div className="profile-view-mode">
                    <p><strong>Usuário:</strong> {profile.username}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Membro desde:</strong> {formatDateDisplay(profile.createdAt)}</p>
                    <button type="button" onClick={handleEditToggle}>Editar Perfil</button>
                </div>
            )}
        </div>
    );
}