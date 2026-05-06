import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ChevronLeft, ChevronRight, ArrowRight, Shield, Fingerprint, Zap } from 'lucide-react';
import slide1 from '../assets/images/slide1.png';
import slide2 from '../assets/images/slide2.png';
import slide3 from '../assets/images/slide3.png';

const slides = [
    {
        id: 1,
        image: slide1,
        title: "Privacy by\nDesign",
        description: "We believe communication should be private. That's why encryption is built from the ground up.",
        icon: <Shield className="w-5 h-5" />,
    },
    {
        id: 2,
        image: slide2,
        title: "You Own\nYour Keys",
        description: "Your private key is generated on your device and never shared. Not with us, not with anyone.",
        icon: <Fingerprint className="w-5 h-5" />,
    },
    {
        id: 3,
        image: slide3,
        title: "Join the\nSecure Community",
        description: "Join thousands of users who trust WhisperBox for their private communications.",
        icon: <Zap className="w-5 h-5" />,
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

    const strengthChecks = [
        { met: passwordStrength.length, label: 'At least 8 characters' },
        { met: passwordStrength.uppercase, label: 'One uppercase letter' },
        { met: passwordStrength.number, label: 'One number' },
    ];

    return (
        <div className="min-h-screen flex mesh-gradient">
            {/* LEFT — Image Slider */}
            <div className="hidden lg:flex lg:w-[55%] relative p-5">
                <div className="relative w-full h-full rounded-3xl overflow-hidden">
                    <div className="absolute inset-0 transition-all duration-700">
                        <img
                            src={slides[currentSlide].image}
                            alt={slides[currentSlide].title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                    </div>

                    <div className="relative z-10 flex flex-col justify-between w-full h-full p-10">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-sm font-medium text-white/90">
                                    {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
                                <Lock className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs text-white/80">Zero-Knowledge</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white">
                                {slides[currentSlide].icon}
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold text-white leading-tight whitespace-pre-line">
                                    {slides[currentSlide].title}
                                </h2>
                                <p className="text-base text-white/70 leading-relaxed max-w-md">
                                    {slides[currentSlide].description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-1.5 rounded-full transition-all duration-500 ${
                                                idx === currentSlide
                                                    ? 'w-10 bg-white'
                                                    : 'w-4 bg-white/25 hover:bg-white/40'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={prevSlide}
                                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-all flex items-center justify-center text-white border border-white/10"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-all flex items-center justify-center text-white border border-white/10"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT — Register Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-[420px] animate-fade-in">
                    {/* Logo */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Lock className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-[var(--text-primary)]">WhisperBox</span>
                                <p className="text-[11px] text-[var(--text-muted)]">End-to-end encrypted</p>
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                            Create account
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Start your secure messaging journey
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                Username
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="input-dark"
                                placeholder="Choose a username"
                                required
                                minLength={3}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="input-dark"
                                placeholder="How others see you"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    className="input-dark pr-12"
                                    placeholder="Create a strong password"
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

                            {/* Password strength */}
                            <div className="mt-3 space-y-1.5">
                                {strengthChecks.map((check) => (
                                    <div key={check.label} className="flex items-center gap-2 text-xs">
                                        {check.met ? (
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                            <XCircle className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                        )}
                                        <span className={check.met ? 'text-emerald-400' : 'text-[var(--text-muted)]'}>
                                            {check.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="input-dark pr-12"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                            disabled={isLoading || !allStrengthMet}
                            className="btn-accent w-full flex items-center justify-center gap-2 py-3.5"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating keys...</span>
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
                    <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] text-center">
                        <p className="text-sm text-[var(--text-muted)]">
                            Already have an account?{' '}
                            <Link to="/login" className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-semibold transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-[var(--text-muted)]">
                        <Lock className="w-3 h-3" />
                        <span className="text-[11px]">Keys are generated locally on your device</span>
                    </div>
                </div>
            </div>
        </div>
    );
}