import { RecentForms } from "@/components/dashboard/recent-forms";
import { Button } from "@/components/ui/button";
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
                        <PlusCircle className="ml-2 h-4 w-4" />
                        טופס חדש
                    </Link>
                </Button>
            </div>
            
            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">הכל</TabsTrigger>
                    <TabsTrigger value="pending">ממתינים</TabsTrigger>
                    <TabsTrigger value="approved">מאושרים</TabsTrigger>
                    <TabsTrigger value="drafts">טיוטות</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="pt-4">
                    {/* The RecentForms component is reused here, in a real app it would be a more complex, paginated table */}
                    <RecentForms />
                </TabsContent>
                <TabsContent value="pending">
                     <p className="p-4 text-muted-foreground">כאן יוצגו טפסים הממתינים לאישור.</p>
                </TabsContent>
                 <TabsContent value="approved">
                     <p className="p-4 text-muted-foreground">כאן יוצגו טפסים שאושרו.</p>
                </TabsContent>
                 <TabsContent value="drafts">
                     <p className="p-4 text-muted-foreground">כאן יוצגו טפסים במצב טיוטה.</p>
                </TabsContent>
            </Tabs>
        </div>
    )
}
