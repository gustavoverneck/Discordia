import { useState, } from 'react';
import '../../Global.css';
import './Login.css';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault(); // evita reload da página

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        // tenta ler mensagem de erro do backend
        const data = await response.json();
        setError(data.message || 'Erro no login');
        setLoading(false);
        return;
      }

      // login bem-sucedido
      // Aqui você pode salvar o token, redirecionar, etc
      alert('Login realizado com sucesso!');
      setLoading(false);
      // Exemplo: redirecionar para dashboard
      window.location.href = '/dashboard';

    } catch (err) {
      setError('Erro na conexão com o servidor.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h2>Bem vindo à Discordia</h2>
        <p className="subtext">Conecte-se com sua conta</p>
        <form onSubmit={handleLogin}>
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
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </label>
          <button type="submit">Entrar</button>
        </form>
        <div className="register-section">
          <p>
            Não tem uma conta?{' '}
            <span
              className="register-link"
              style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => window.location.href = '/register'}
            >
              Registrar-se
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
