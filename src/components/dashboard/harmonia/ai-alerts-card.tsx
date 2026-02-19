import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, Bot, CheckCircle, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const alerts = [
  { icon: AlertTriangle, color: 'text-orange-500', text: 'למורה <b>דני שגב</b> יש עומס של 95% על המערכת.', action: 'נהל עומס' },
  { icon: UserX, color: 'text-red-500', text: 'לתלמידה <b>נועה בר</b> יש 3 היעדרויות לא מוצדקות החודש.', action: 'צור קשר' },
  { icon: CheckCircle, color: 'text-green-500', text: 'כל טפסי בחינות הבגרות אושרו ונשלחו למשרד החינוך.', action: 'צפה בטפסים' },
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
                {alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <alert.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${alert.color}`} />
                        <div className="flex-1">
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: alert.text }} />
                            <Button variant="link" size="sm" className="p-0 h-auto" asChild>
                                <Link href="#">{alert.action}</Link>
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
