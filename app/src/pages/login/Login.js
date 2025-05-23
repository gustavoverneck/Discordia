import { useState } from 'react';
import '../../Global.css'; // Certifique-se que este caminho está correto
import './Login.css';    // Certifique-se que este caminho está correto

export default function LoginScreen() {
  // O estado 'username' pode conter o email ou o nome de usuário para login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault(); // Evita reload da página

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Enviando 'loginIdentifier' como o campo 'email' que o backend espera
        body: JSON.stringify({ email: loginIdentifier, password })
      });

      const data = await response.json(); // Sempre tente parsear o JSON

      if (!response.ok) {
        // O backend envia erros na chave 'error'
        setError(data.error || 'Erro no login. Verifique suas credenciais.');
        setLoading(false);
        return;
      }

      // Login bem-sucedido: o backend retorna 'token' e 'user'
      console.log('Login bem-sucedido:', data);
      alert(`Login realizado com sucesso! Bem-vindo, ${data.user?.username || 'usuário'}!`);

      // Salvar o token (ex: no localStorage) para uso em requisições autenticadas
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user)); // Opcional: salvar dados do usuário
      }

      setLoading(false);

      // Exemplo: redirecionar para dashboard
      // Idealmente, use um sistema de rotas do React (React Router) para isso
      window.location.href = '/dashboard'; // Ou a rota que você configurou

    } catch (err) {
      console.error('Erro na requisição de login:', err);
      setError('Erro de conexão com o servidor. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <h2>Bem vindo à Discordia</h2>
        <p className="subtext">Conecte-se com sua conta</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <label>
            Email ou Usuário {/* Label atualizada para clareza */}
            <input
              type="text" // Pode ser 'email' se você quiser validação de formato de email pelo navegador
              value={loginIdentifier}
              onChange={(e) => setLoginIdentifier(e.target.value)}
              placeholder="Digite seu email ou usuário"
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
              placeholder="Digite sua senha"
              required
              disabled={loading}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="register-section">
          <p>
            Não tem uma conta?{' '}
            <span
              className="register-link"
              onClick={() => { if (!loading) window.location.href = '/register'; }} // Evita navegação durante o loading
            >
              Registrar-se
            </span>
          </p>
        </div>
        {/* Para fins de depuração, você pode mostrar o token ou erro: */}
        {/* {localStorage.getItem('authToken') && <p>Token: {localStorage.getItem('authToken')}</p>} */}
      </div>
    </div>
  );
}