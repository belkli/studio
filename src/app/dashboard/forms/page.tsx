import { FormsList } from "@/components/dashboard/forms-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function FormsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">ניהול טפסים</h1>
                    <p className="text-muted-foreground">צפה, סנן ונהל את כל הטפסים.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/forms/new">
                        <PlusCircle className="me-2 h-4 w-4" />
                        טופס חדש
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue="all">
                        <div className="p-4 border-b">
                            <TabsList>
                                <TabsTrigger value="all">הכל</TabsTrigger>
                                <TabsTrigger value="pending">ממתינים</TabsTrigger>
                                <TabsTrigger value="approved">מאושרים</TabsTrigger>
                                <TabsTrigger value="drafts">טיוטות</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="all" className="pt-0">
                            <FormsList />
                        </TabsContent>
                        <TabsContent value="pending" className="pt-0">
                            <FormsList statusFilter={['ממתין לאישור מורה', 'ממתין לאישור מנהל']} />
                        </TabsContent>
                        <TabsContent value="approved" className="pt-0">
                            <FormsList statusFilter={['מאושר']} />
                        </TabsContent>
                        <TabsContent value="drafts" className="pt-0">
                            <FormsList statusFilter={['טיוטה']} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
