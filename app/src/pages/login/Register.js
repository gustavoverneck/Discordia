import { useState } from 'react';
import '../../Global.css';
import './Login.css';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister(event) {
        event.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Erro no registro');
                setLoading(false);
                return;
            }

            alert('Registro realizado com sucesso!');
            setLoading(false);
            window.location.href = '/';
        } catch (err) {
            setError('Erro na conexão com o servidor.');
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="card login-card">
                <h2>Crie sua conta na Discordia</h2>
                <p className="subtext">Preencha os dados para registrar-se</p>
                <form onSubmit={handleRegister}>
                    <label>
                        Usuário
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Digite seu usuário"
                            required
                        />
                    </label>
                    <label>
                        E-mail
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Digite seu e-mail"
                            required
                        />
                    </label>
                    <label>
                        Senha
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            required
                        />
                    </label>
                    <label>
                        Confirmar Senha
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirme sua senha"
                            required
                        />
                    </label>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                </form>
                <div className="register-section">
                    <p>
                        Já tem uma conta?{' '}
                        <span
                            className="register-link"
                            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => window.location.href = '/login'}
                        >
                            Entrar
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}