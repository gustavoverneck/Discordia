import React, { useEffect, useState } from 'react';
import '../../Global.css';
import './Perfil.css';

export function Profile({ onClose }) {
    const [profile, setProfile] = useState(null);
    const [edit, setEdit] = useState(false);
    const [form, setForm] = useState({ username: '', email: '' });

    useEffect(() => {
        fetch('/api/profile', { credentials: 'include' })
            .then((res) => res.json())
            .then((data) => {
                setProfile(data);
                setForm({ username: data.username, email: data.email });
            })
            .catch(() => setProfile(null));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(form),
        })
            .then((res) => res.json())
            .then((data) => {
                setProfile(data);
                setEdit(false);
            });
    };

    if (!profile) {
        return (
            <div style={modalStyle}>
                <div style={modalContentStyle}>
                    <button style={closeBtnStyle} onClick={onClose}>×</button>
                    Carregando perfil...
                </div>
            </div>
        );
    }

    return (
        <div style={modalStyle}>
            <div style={modalContentStyle}>
                <button style={closeBtnStyle} onClick={onClose}>×</button>
                <h2>Perfil do Usuário</h2>
                {edit ? (
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>Usuário: </label>
                            <input
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Email: </label>
                            <input
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                            />
                        </div>
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={() => setEdit(false)}>Cancelar</button>
                    </form>
                ) : (
                    <>
                        <p><strong>ID:</strong> {profile.id}</p>
                        <p><strong>Usuário:</strong> {profile.username}</p>
                        <p><strong>Email:</strong> {profile.email}</p>
                        <button onClick={() => setEdit(true)}>Editar</button>
                    </>
                )}
            </div>
        </div>
    );
}

// Estilos simples para modal
const modalStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const modalContentStyle = {
    background: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    minWidth: '300px',
    position: 'relative',
};

const closeBtnStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '1.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
};

export default Profile;