import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Calendar, CircleDollarSign } from "lucide-react"

export function KeyMetricsBar() {
    // In a real app, this data would be fetched from the backend.
    const stats = [
        { title: "תלמידים פעילים", value: "87", icon: Users, color: "text-blue-500" },
        { title: "שיעורים השבוע", value: "112", icon: Calendar, color: "text-green-500" },
        { title: "אישורים ממתינים", value: "4", icon: BookOpen, color: "text-orange-500" },
        { title: "הכנסה החודש", value: "41,400 ₪", icon: CircleDollarSign, color: "text-purple-500" },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
