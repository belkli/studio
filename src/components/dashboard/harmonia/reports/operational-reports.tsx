'use client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function OperationalReports() {
    const { mockLessons, mockTeachers } = useAuth();

    const cancellationData = [
        { name: 'ביטול תלמיד (בזמן)', value: mockLessons.filter(l => l.status === 'CANCELLED_STUDENT_NOTICED').length },
        { name: 'ביטול תלמיד (איחור)', value: mockLessons.filter(l => l.status === 'CANCELLED_STUDENT_NO_NOTICE').length },
        { name: 'ביטול מורה', value: mockLessons.filter(l => l.status === 'CANCELLED_TEACHER').length },
        { name: 'לא הופעה', value: mockLessons.filter(l => l.status === 'NO_SHOW_STUDENT').length },
    ];
    
    const capacityData = mockTeachers.map(teacher => ({
        name: teacher.name,
        capacity: Math.floor(Math.random() * (100 - 60 + 1) + 60), // Mock capacity
    }));

    return (
         <div className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>התפלגות ביטולים</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={cancellationData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={(entry) => `${entry.name} (${entry.value})`}>
                                    {cancellationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [value, 'מספר שיעורים']}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>שיעור המרה (שיעור ניסיון להרשמה)</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[300px]">
                        <div className="text-5xl font-bold text-primary">68%</div>
                        <p className="text-muted-foreground mt-2">21 מתוך 31 תלמידי ניסיון נרשמו החודש.</p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>קיבולת מורים (% תפוסה)</CardTitle>
                </CardHeader>
                 <CardContent className="h-[350px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={capacityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `${value}%`} />
                            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} tickLine={false} axisLine={false}/>
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    direction: 'rtl',
                                }}
                                 formatter={(value: number) => [`${value}% תפוסה`, 'קיבולת']}
                            />
                            <Bar dataKey="capacity" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
