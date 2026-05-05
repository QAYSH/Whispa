import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { Shield, Eye, EyeOff, CheckCircle, XCircle, ChevronLeft, ChevronRight, ArrowRight, Users, Globe, Lock } from 'lucide-react';
import slide1 from '../assets/images/slide1.png';
import slide2 from '../assets/images/slide2.png';
import slide3 from '../assets/images/slide3.png';

const slides = [
    {
        id: 1,
        image: slide1,
        title: "Your Privacy Matters",
        description: "We believe communication should be private. That's why we built end-to-end encryption from the ground up.",
    },
    {
        id: 2,
        image: slide2,
        title: "You Control Your Keys",
        description: "Your private key is generated on your device and never shared. Not with us, not with anyone.",
    },
    {
        id: 3,
        image: slide3,
        title: "Join Secure Community",
        description: "Join thousands of users who trust WhisperBox for their private communications.",
    },
];

export function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const [passwordStrength, setPasswordStrength] = useState({
        length: false,
        uppercase: false,
        number: false,
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    const handlePasswordChange = (pwd: string) => {
        setFormData({ ...formData, password: pwd });
        setPasswordStrength({
            length: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            number: /[0-9]/.test(pwd),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number) {
            setError('Password does not meet requirements');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await register(formData.username, formData.displayName, formData.password);
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const allStrengthMet = passwordStrength.length && passwordStrength.uppercase && passwordStrength.number;

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* LEFT SIDE - Image Slider with Padding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 transition-opacity duration-700">
                        <img
                            src={slides[currentSlide].image}
                            alt={slides[currentSlide].title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20"></div>
                    </div>

                    <div className="relative z-10 flex flex-col justify-between w-full h-full p-8 md:p-10">
                        <div className="flex justify-start">
                            <div className="text-sm font-medium bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white">
                                {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                {slides[currentSlide].title}
                            </h2>
                            <p className="text-base md:text-lg text-gray-100 leading-relaxed max-w-sm">
                                {slides[currentSlide].description}
                            </p>
                        </div>

                        <div className="space-y-6">
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

                            <div className="flex justify-between items-center -mx-2">
                                <button
                                    onClick={prevSlide}
                                    className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white ml-2"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-xs text-gray-200">🔐 Zero-knowledge architecture</span>
                                <button
                                    onClick={nextSlide}
                                    className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all text-white mr-2"
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
                            Create account
                        </h1>
                        <p className="text-sm text-gray-500">
                            Start your secure messaging journey
                        </p>
                    </div>

                    {/* Trust Badges */}
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                placeholder="Choose a username"
                                required
                                minLength={3}
                            />
                            <p className="text-xs text-gray-400 mt-1">Minimum 3 characters</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                placeholder="How others see you"
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
                                    value={formData.password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white pr-11"
                                    placeholder="Create a strong password"
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

                            <div className="mt-2 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs">
                                    {passwordStrength.length ?
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                                        <XCircle className="w-3.5 h-3.5 text-gray-300" />
                                    }
                                    <span className={passwordStrength.length ? 'text-green-600' : 'text-gray-400'}>
                    At least 8 characters
                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {passwordStrength.uppercase ?
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                                        <XCircle className="w-3.5 h-3.5 text-gray-300" />
                                    }
                                    <span className={passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}>
                    At least one uppercase letter
                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {passwordStrength.number ?
                                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> :
                                        <XCircle className="w-3.5 h-3.5 text-gray-300" />
                                    }
                                    <span className={passwordStrength.number ? 'text-green-600' : 'text-gray-400'}>
                    At least one number
                  </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white pr-11"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !allStrengthMet}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}