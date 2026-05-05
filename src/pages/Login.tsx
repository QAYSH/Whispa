import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { unwrapPrivateKey, deriveWrappingKey } from '../crypto/keyDerivation';
import { importPublicKey } from '../crypto/rsa';
import { useAuthStore, useCryptoStore } from '../store/useStore';
import { Lock, Eye, EyeOff, ChevronLeft, ChevronRight, ArrowRight, Shield, Users, Globe } from 'lucide-react';
import slide1 from '../assets/images/slide1.png';
import slide2 from '../assets/images/slide2.png';
import slide3 from '../assets/images/slide3.png';

const slides = [
    {
        id: 1,
        image: slide1,
        title: "End-to-End Encrypted",
        description: "Your messages are encrypted on your device before they ever leave. Only you and your recipient can read them.",
    },
    {
        id: 2,
        image: slide2,
        title: "Private Key Stays Local",
        description: "Your private key never leaves your device. We can't read your messages even if we wanted to.",
    },
    {
        id: 3,
        image: slide3,
        title: "Secure by Default",
        description: "Every message is protected with military-grade AES-256 encryption combined with RSA-2048.",
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
    const [rememberMe, setRememberMe] = useState(false);

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
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* LEFT SIDE - Image Slider with Padding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    {/* Current Slide Image - Full Cover */}
                    <div className="absolute inset-0 transition-opacity duration-700">
                        <img
                            src={slides[currentSlide].image}
                            alt={slides[currentSlide].title}
                            className="w-full h-full object-cover"
                        />
                        {/* Dark Gradient Overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20"></div>
                    </div>

                    {/* Slide Content Overlay */}
                    <div className="relative z-10 flex flex-col justify-between w-full h-full p-8 md:p-10">
                        {/* Slide Counter */}
                        <div className="flex justify-start">
                            <div className="text-sm font-medium bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white">
                                {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                            </div>
                        </div>

                        {/* Slide Text Content */}
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                {slides[currentSlide].title}
                            </h2>
                            <p className="text-base md:text-lg text-gray-100 leading-relaxed max-w-sm">
                                {slides[currentSlide].description}
                            </p>
                        </div>

                        {/* Navigation with Padding */}
                        <div className="space-y-6">
                            {/* Slide Indicators */}
                            <div className="flex gap-2">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlide(idx)}
                                        className={`h-1 rounded-full transition-all duration-300 ${
                                            idx === currentSlide
                                                ? 'w-8 bg-white'
                                                : 'w-4 bg-white/40 hover:bg-white/60'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Navigation Buttons - With proper padding from edges */}
                            <div className="flex justify-between items-center -mx-2">
                                <button
                                    onClick={prevSlide}
                                    className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white ml-2"
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-xs text-gray-200">🔐 End-to-end encrypted</span>
                                <button
                                    onClick={nextSlide}
                                    className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white mr-2"
                                    aria-label="Next slide"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - White Card Form */}
            <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 md:p-8">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 md:p-10">
                    {/* Logo inside card - Top Left */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Lock className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">WhisperBox</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">End-to-end encrypted messaging</p>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome back
                        </h1>
                        <p className="text-sm text-gray-500">
                            Sign in to your secure account
                        </p>
                    </div>

                    {/* Trust Badges - Stats Row */}
                    <div className="flex justify-between items-center gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-600">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-semibold">10k+</span>
                            </div>
                            <p className="text-xs text-gray-500">Messages secured</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-600">
                                <Globe className="w-4 h-4" />
                                <span className="text-sm font-semibold">50+</span>
                            </div>
                            <p className="text-xs text-gray-500">Countries</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200"></div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-blue-600">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-semibold">100%</span>
                            </div>
                            <p className="text-xs text-gray-500">Encrypted</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white pr-11"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password Row */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Keep me signed in</span>
                            </label>
                            <button
                                type="button"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}