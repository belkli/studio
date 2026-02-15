import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BadgeCheck, Clock, File, FileCheck, FileX } from "lucide-react"

export function OverviewCards() {
    // In a real app, this data would be fetched based on the user's role and data.
    const stats = [
        { title: "אישורים ממתינים", value: "3", icon: Clock, color: "text-orange-500" },
        { title: "טפסים שאושרו", value: "12", icon: FileCheck, color: "text-green-500" },
        { title: "טפסים שנדחו", value: "1", icon: FileX, color: "text-red-500" },
        { title: "סך הכל הגשות", value: "16", icon: File, color: "text-primary" },
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
