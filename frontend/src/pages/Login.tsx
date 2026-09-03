import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/auth/login', {
                username,
                password,
            });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || '用户名或密码错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-200 via-teal-200 to-green-200">
            {/* 动态背景装饰圆 - 颜色调浅 */}
            <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/20 rounded-full blur-3xl" />

            {/* 登录卡片 - 毛玻璃效果，调亮背景 */}
            <Card className="relative w-full max-w-md mx-4 backdrop-blur-xl bg-white/30 border border-white/40 shadow-2xl shadow-emerald-400/20">
                <CardHeader className="space-y-1 text-center">
                    {/* 图标装饰 - 浅色渐变 */}
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 shadow-lg shadow-emerald-300/50">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-emerald-800 tracking-tight">
                        通用后台
                    </CardTitle>
                    <CardDescription className="text-emerald-700/70 text-base">
                        登录以继续访问管理系统
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-emerald-800/80 text-sm font-medium">
                                用户名
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="请输入用户名"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-white/40 border-emerald-300/50 text-emerald-900 placeholder:text-emerald-400/60 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-200"
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-emerald-800/80 text-sm font-medium">
                                密码
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="请输入密码"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/40 border-emerald-300/50 text-emerald-900 placeholder:text-emerald-400/60 focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent transition-all duration-200"
                                disabled={loading}
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 bg-red-200/60 border border-red-300/50 rounded-lg px-4 py-2.5 text-center animate-in slide-in-from-top-2 duration-200">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-300/40 hover:shadow-emerald-400/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    登录中...
                                </>
                            ) : (
                                '登 录'
                            )}
                        </Button>
                        {/* 底部提示 */}
                        <p className="text-center text-emerald-700/40 text-xs mt-4">
                            演示账号：admin / 123456
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}