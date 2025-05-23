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
            setError('Passwords do not match.');
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
            const data = await response.json(); // Try to parse even if !response.ok to get error msg
            console.log('[DEBUG] Response data:', data);

            if (!response.ok) {
                console.log('[DEBUG] Response not OK (backend error)');
                setError(data.error || 'Registration error. Please try again.');
                setLoading(false);
                return;
            }

            console.log('[DEBUG] Registration successful on frontend:', data);
            alert(data.message || `User ${data.user?.username} registered successfully!`);

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                console.log('[DEBUG] Token saved to localStorage');
            }
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
            }

            setLoading(false);
            console.log('[DEBUG] Redirecting to /dashboard');
            window.location.href = '/dashboard'; // Ideally use React Router

        } catch (err) {
            console.error('[DEBUG] ERROR in handleRegister catch block:', err);
            setError('Connection error or invalid server response. Please try again later.');
            setLoading(false);
        }
    }

    return (
        <div className="login-container">
            <div className="card login-card">
                <h2>Create your account on Discordia</h2>
                <p className="subtext">Fill in the details to register</p>
                {error && <p className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</p>}
                <form onSubmit={handleRegister}>
                    <label>
                        Username
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Minimum 3 characters"
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
                            placeholder="Enter your email"
                            required
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Minimum 6 characters"
                            required
                            minLength="6"
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Confirm Password
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                            disabled={loading}
                        />
                    </label>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <div className="register-section">
                    <p>
                        Already have an account?{' '}
                        <span
                            className="register-link"
                            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => { if (!loading) window.location.href = '/login'; }}
                        >
                            Login
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}