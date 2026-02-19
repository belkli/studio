import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, Bot, CheckCircle, UserX, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const alerts = [
  { id: 'alert-1', icon: AlertTriangle, color: 'text-orange-500', text: 'למורה <b>דני שגב</b> יש עומס של 95% על המערכת.', action: 'נהל עומס', link: '#' },
  { id: 'alert-2', icon: UserX, color: 'text-red-500', text: 'לתלמידה <b>נועה בר</b> יש 3 היעדרויות לא מוצדקות החודש.', action: 'צור קשר', link: '#' },
  { id: 'alert-3', icon: LineChart, color: 'text-blue-500', text: 'נרשמה ירידה של 15% בהרשמות החודש.', action: 'צפה בדוח', link: '/dashboard/reports' },
];

export function AiAlertsCard() {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <div>
                    <CardTitle>התראות מהסוכן החכם</CardTitle>
                    <CardDescription>בעיות תפעוליות הדורשות את תשומת לבך.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3">
                        <alert.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${alert.color}`} />
                        <div className="flex-1">
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: alert.text }} />
                            <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                                <Link href={alert.link}>{alert.action}</Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
