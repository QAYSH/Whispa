import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { unwrapPrivateKey, deriveWrappingKey } from '../crypto/KeyDerivation';
import { importPublicKey } from '../crypto/rsa';
import { useAuthStore, useCryptoStore } from '../store/useStore';
import { Lock, Eye, EyeOff, ChevronLeft, ChevronRight, ArrowRight, Shield, Fingerprint, Zap } from 'lucide-react';
import slide1 from '../assets/images/slide1.png';
import slide2 from '../assets/images/slide2.png';
import slide3 from '../assets/images/slide3.png';

const slides = [
    {
        id: 1,
        image: slide1,
        title: "Zero-Knowledge\nEncryption",
        description: "Your messages are encrypted on your device before they leave. The server never sees plaintext.",
        icon: <Shield className="w-5 h-5" />,
    },
    {
        id: 2,
        image: slide2,
        title: "Your Keys,\nYour Control",
        description: "Private keys never leave your device. We can't read your messages — even if we wanted to.",
        icon: <Fingerprint className="w-5 h-5" />,
    },
    {
        id: 3,
        image: slide3,
        title: "Military-Grade\nSecurity",
        description: "AES-256-GCM combined with RSA-2048 ensures every message is protected by industry-leading encryption.",
        icon: <Zap className="w-5 h-5" />,
    },
];

export function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const setUser = useAuthStore((state) => state.setUser);
    const setKeys = useCryptoStore((state) => state.setKeys);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const authData = await login(username, password);
            const salt = Uint8Array.from(atob(authData.user.pbkdf2_salt), c => c.charCodeAt(0));
            const wrappingKey = await deriveWrappingKey(password, salt);
            const privateKey = await unwrapPrivateKey(authData.user.wrapped_private_key, wrappingKey);
            const publicKey = await importPublicKey(authData.user.public_key);

            setKeys(privateKey, publicKey);
            setUser({
                id: authData.user.id,
                username: authData.user.username,
                display_name: authData.user.display_name,
                public_key: authData.user.public_key,
                created_at: authData.user.created_at,
            });
            navigate('/chat');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[var(--bg-primary)]">
            {/* ═══════════════════ LEFT — Image Slider ═══════════════════ */}
            <div className="hidden lg:block lg:w-[50%] p-5">
                <div className="relative w-full h-full rounded-3xl overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-0 transition-all duration-700">
                        <img
                            src={slides[currentSlide].image}
                            alt={slides[currentSlide].title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/25" />
                    </div>

                    {/* Overlay Content */}
                    <div className="relative z-10 flex flex-col justify-between w-full h-full p-10">
                        {/* Top — Logo + Badge */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center">
                                    <Lock className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-base font-bold text-white">WhisperBox</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
                                <Lock className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-white/80">E2E Encrypted</span>
                            </div>
                        </div>

                        {/* Middle — Content */}
                        <div className="space-y-6 max-w-lg">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white">
                                {slides[currentSlide].icon}
                            </div>

                            <div className="space-y-3">
                                <h2 className="text-4xl lg:text-[44px] font-bold text-white leading-tight whitespace-pre-line">
                                    {slides[currentSlide].title}
                                </h2>
                                <p className="text-[15px] text-white/60 leading-relaxed max-w-md">
                                    {slides[currentSlide].description}
                                </p>
                            </div>

                            {/* Testimonial */}
                            <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl p-5 max-w-md">
                                <p className="text-sm text-white/75 italic leading-relaxed mb-4">
                                    "WhisperBox gave me peace of mind knowing my conversations are truly private. The encryption is seamless and the UI is beautiful."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                                        AK
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Amara K.</p>
                                        <p className="text-xs text-white/40">Security Engineer • Lagos</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom — Stats + Nav */}
                        <div className="space-y-6">
                            <div className="flex gap-12">
                                <div>
                                    <p className="text-3xl font-bold text-white">10k+</p>
                                    <p className="text-xs text-white/40 mt-1">Messages secured</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-white">50+</p>
                                    <p className="text-xs text-white/40 mt-1">Countries</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-white">100%</p>
                                    <p className="text-xs text-white/40 mt-1">Encrypted</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                                idx === currentSlide ? 'w-10 bg-white' : 'w-4 bg-white/20 hover:bg-white/40'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={prevSlide} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white border border-white/10">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={nextSlide} className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white border border-white/10">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════ RIGHT — Login Form ═══════════════════ */}
            <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-20">
                <div className="w-full max-w-[420px] animate-fade-in">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-[var(--text-primary)]">WhisperBox</span>
                            <p className="text-xs text-[var(--text-muted)]">End-to-end encrypted</p>
                        </div>
                    </div>

                    {/* Heading */}
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Welcome back</h1>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-10">
                        Sign in to access your encrypted conversations
                    </p>

                    {/* ─── Form ─── */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-2">
                                Username <span className="text-[var(--accent-primary)]">*</span>
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-dark"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-medium text-[var(--text-primary)] mb-2">
                                Password <span className="text-[var(--accent-primary)]">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-dark pr-12"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-accent w-full flex items-center justify-center gap-2 py-3.5"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Decrypting keys...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Separator */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-px bg-[var(--border-subtle)]"></div>
                        <span className="text-xs text-[var(--text-muted)]">or</span>
                        <div className="flex-1 h-px bg-[var(--border-subtle)]"></div>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-[var(--text-muted)]">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-semibold transition-colors">
                            Create account
                        </Link>
                    </p>

                    {/* Trust badges */}
                    <div className="mt-10 pt-8 border-t border-[var(--border-subtle)] flex items-center justify-center gap-8">
                        {[
                            { icon: <Shield className="w-4 h-4" />, label: 'AES-256', color: 'text-emerald-400' },
                            { icon: <Fingerprint className="w-4 h-4" />, label: 'RSA-2048', color: 'text-purple-400' },
                            { icon: <Zap className="w-4 h-4" />, label: 'Zero-Knowledge', color: 'text-cyan-400' },
                        ].map((badge) => (
                            <div key={badge.label} className="flex items-center gap-1.5">
                                <span className={badge.color}>{badge.icon}</span>
                                <span className="text-[11px] font-medium text-[var(--text-muted)]">{badge.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 text-[var(--text-muted)]">
                        <Lock className="w-3 h-3" />
                        <span className="text-[11px]">Your private key never leaves this device</span>
                    </div>
                </div>
            </div>
        </div>
    );
}