import { useEffect, useState } from 'react';
import api from '@/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Users, UserCheck, UserPlus, Activity, Loader2 } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

// ========== 类型定义 ==========
interface User {
    id: number;
    username: string;
    email: string | null;
    createTime: string;
    isActive: boolean;
}

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    todayNewUsers: number;
    totalOperations: number;
}

// ========== 颜色配置 ==========
const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

// ========== 主组件 ==========
export default function Dashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        todayNewUsers: 0,
        totalOperations: 0,
    });

    // ========== 获取数据 ==========
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userData = response.data;
            setUsers(userData);

            // 计算统计数据
            const total = userData.length;
            const active = userData.filter((u: User) => u.isActive).length;
            const today = new Date().toDateString();
            const todayNew = userData.filter((u: User) =>
                new Date(u.createTime).toDateString() === today
            ).length;

            setStats({
                totalUsers: total,
                activeUsers: active,
                todayNewUsers: todayNew,
                totalOperations: total * 3, // 模拟数据：每个用户平均3次操作
            });
        } catch (error) {
            console.error('获取数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ========== 准备图表数据 ==========
    // 近7天用户增长趋势
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        }
        return days;
    };

    const getWeeklyData = () => {
        const dayLabels = getLast7Days();
        // 模拟数据：按天统计注册用户数
        const counts = dayLabels.map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dateStr = date.toDateString();
            const count = users.filter(u =>
                new Date(u.createTime).toDateString() === dateStr
            ).length;
            return {
                name: dayLabels[index],
                注册用户: count,
            };
        });
        return counts;
    };

    // 用户状态分布
    const getStatusDistribution = () => {
        const active = users.filter(u => u.isActive).length;
        const inactive = users.filter(u => !u.isActive).length;
        return [
            { name: '启用', value: active },
            { name: '禁用', value: inactive },
        ];
    };

    // ========== 统计卡片组件 ==========
    const StatCard = ({
        title,
        value,
        description,
        icon: Icon,
        color,
    }: {
        title: string;
        value: number;
        description?: string;
        icon: any;
        color: string;
    }) => (
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="h-4 w-4 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-800">{value}</div>
                {description && (
                    <p className="text-xs text-gray-400 mt-1">{description}</p>
                )}
            </CardContent>
        </Card>
    );

    // ========== 最近用户列表 ==========
    const recentUsers = users.slice(0, 5);

    // ========== 加载状态 ==========
    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
                <p className="text-sm text-gray-500 mt-1">系统概览与数据统计</p>
            </div>

            {/* ===== 统计卡片 ===== */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="总用户"
                    value={stats.totalUsers}
                    description="系统注册用户总数"
                    icon={Users}
                    color="bg-emerald-400"
                />
                <StatCard
                    title="活跃用户"
                    value={stats.activeUsers}
                    description={`占比 ${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%`}
                    icon={UserCheck}
                    color="bg-teal-400"
                />
                <StatCard
                    title="今日新增"
                    value={stats.todayNewUsers}
                    description="今日新注册用户"
                    icon={UserPlus}
                    color="bg-green-400"
                />
                <StatCard
                    title="总操作数"
                    value={stats.totalOperations}
                    description="系统累计操作记录"
                    icon={Activity}
                    color="bg-emerald-500"
                />
            </div>

            {/* ===== 图表区域 ===== */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* 折线图：近7天趋势 */}
                <Card className="md:col-span-2 border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-gray-700">
                            近7天注册趋势
                        </CardTitle>
                        <CardDescription>每日新增用户数量</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={getWeeklyData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#999' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#999' }}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="注册用户"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 饼图：用户状态分布 */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold text-gray-700">
                            用户状态分布
                        </CardTitle>
                        <CardDescription>启用/禁用占比</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={getStatusDistribution()}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {getStatusDistribution().map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }}
                                    formatter={(value) => [`${value} 人`, '']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* 图例 */}
                        <div className="flex justify-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                                启用
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-200" />
                                禁用
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ===== 最近用户列表 ===== */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-700">
                        最近注册用户
                    </CardTitle>
                    <CardDescription>最新加入的5位用户</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>用户名</TableHead>
                                <TableHead>邮箱</TableHead>
                                <TableHead>注册时间</TableHead>
                                <TableHead>状态</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-400 py-6">
                                        暂无用户
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.email || '-'}</TableCell>
                                        <TableCell>
                                            {new Date(user.createTime).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}
                                            >
                                                {user.isActive ? '启用' : '禁用'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}