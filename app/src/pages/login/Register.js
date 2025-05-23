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
        console.log('[DEBUG] handleRegister STARTED');
        event.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            console.log('[DEBUG] Passwords do not match');
            setError('As senhas não coincidem.');
            return;
        }

        console.log('[DEBUG] Passwords match, setting loading to true');
        setLoading(true);

        try {
            console.log('[DEBUG] Trying to fetch /register with:', { username, email, password });
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            console.log('[DEBUG] Fetch response status:', response.status, response.statusText);
            const data = await response.json();
            console.log('[DEBUG] Response data:', data);

            if (!response.ok) {
                console.log('[DEBUG] Response not OK (backend error)');
                setError(data.error || 'Erro no registro. Por favor, tente novamente.');
                setLoading(false);
                return;
            }

            console.log('[DEBUG] Registration successful on frontend:', data);
            alert(data.message || `Usuário ${data.user?.username} registrado com sucesso!`);

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                console.log('[DEBUG] Token saved to localStorage');
            }
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
            }

            setLoading(false);
            console.log('[DEBUG] Redirecting to /dashboard');
            window.location.href = '/dashboard';

        } catch (err) {
            console.error('[DEBUG] ERROR in handleRegister catch block:', err);
            setError('Erro de conexão ou resposta inválida do servidor. Por favor, tente novamente mais tarde.');
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="card login-card">
                <h2>Crie sua conta na Discordia</h2>
                <p className="subtext">Preencha os detalhes para se registrar</p>
                {error && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
                <form onSubmit={handleRegister}>
                    <label>
                        Nome de usuário
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Mínimo de 3 caracteres"
                            required
                            minLength="3"
                            maxLength="32"
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Digite seu email"
                            required
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Senha
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo de 6 caracteres"
                            required
                            minLength="6"
                            disabled={loading}
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
                            disabled={loading}
                        />
                    </label>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                </form>
                <div className="register-section">
                    <p>
                        Já possui uma conta?{' '}
                        <span
                            className="register-link"
                            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => { if (!loading) window.location.href = '/login'; }}
                        >
                            Entrar
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}