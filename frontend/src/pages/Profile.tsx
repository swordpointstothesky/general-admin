import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Mail, Calendar, Shield, KeyRound } from 'lucide-react';

interface Profile {
    id: number;
    username: string;
    email: string | null;
    createTime: string;
    roles: string[];
}

export default function Profile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // 邮箱修改
    const [email, setEmail] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);

    // 密码修改
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const navigate = useNavigate();

    // ========== 获取个人信息 ==========
    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/profile');
            setProfile(response.data);
            setEmail(response.data.email || '');
        } catch (err: any) {
            alert(err.response?.data?.message || '获取个人信息失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // ========== 更新邮箱 ==========
    const handleUpdateEmail = async () => {
        setSavingEmail(true);
        try {
            await api.put('/api/profile', { email });
            alert('邮箱更新成功');
            fetchProfile();
        } catch (err: any) {
            alert(err.response?.data?.message || '更新失败');
        } finally {
            setSavingEmail(false);
        }
    };

    // ========== 修改密码 ==========
    const handleChangePassword = async () => {
        setPasswordError('');

        if (!passwordForm.oldPassword) {
            setPasswordError('请输入旧密码');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordError('新密码长度不能少于6位');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('两次输入的新密码不一致');
            return;
        }

        setSavingPassword(true);
        try {
            await api.put('/api/profile/password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            });
            alert('密码修改成功，请重新登录');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || '修改密码失败');
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">个人中心</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    管理你的个人信息和密码
                </p>
            </div>

            {/* ===== 基本信息 ===== */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-5 w-5" />
                        基本信息
                    </CardTitle>
                    <CardDescription>查看你的账户信息</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-muted-foreground mb-1">用户名</div>
                            <div className="font-medium">{profile?.username}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground mb-1">创建时间</div>
                            <div className="font-medium flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {profile && new Date(profile.createTime).toLocaleDateString('zh-CN')}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-muted-foreground mb-1">拥有角色</div>
                            <div className="flex flex-wrap gap-1">
                                {profile?.roles.map((role) => (
                                    <Badge key={role} variant="secondary">
                                        <Shield className="h-3 w-3 mr-1" />
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ===== 修改邮箱 ===== */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Mail className="h-5 w-5" />
                        修改邮箱
                    </CardTitle>
                    <CardDescription>更新你的联系邮箱</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="email">邮箱</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="请输入邮箱"
                        />
                    </div>
                    <Button onClick={handleUpdateEmail} disabled={savingEmail}>
                        {savingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存邮箱
                    </Button>
                </CardContent>
            </Card>

            {/* ===== 修改密码 ===== */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <KeyRound className="h-5 w-5" />
                        修改密码
                    </CardTitle>
                    <CardDescription>修改后需要重新登录</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="oldPassword">旧密码 *</Label>
                        <Input
                            id="oldPassword"
                            type="password"
                            value={passwordForm.oldPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                            }
                            placeholder="请输入当前密码"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="newPassword">新密码 *</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            placeholder="至少6位"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="confirmPassword">确认新密码 *</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            placeholder="再次输入新密码"
                        />
                    </div>
                    {passwordError && (
                        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                            {passwordError}
                        </div>
                    )}
                    <Button onClick={handleChangePassword} disabled={savingPassword}>
                        {savingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        修改密码
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}