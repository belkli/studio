import { FormsList } from "@/components/dashboard/forms-list";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

export default function FormsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">ניהול טפסים</h1>
                <p className="text-muted-foreground">צפה, סנן ונהל את כל הטפסים.</p>
            </div>
            
            <Tabs defaultValue="all">
                <div className="flex items-center justify-between border-b pb-4">
                    <TabsList>
                        <TabsTrigger value="all">הכל</TabsTrigger>
                        <TabsTrigger value="pending">ממתינים</TabsTrigger>
                        <TabsTrigger value="approved">מאושרים</TabsTrigger>
                        <TabsTrigger value="drafts">טיוטות</TabsTrigger>
                    </TabsList>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                        type="search"
                        placeholder="חיפוש..."
                        className="w-full rounded-lg bg-muted ps-10"
                        />
                    </div>
                </div>
                <TabsContent value="all" className="pt-4">
                    <FormsList />
                </TabsContent>
                <TabsContent value="pending" className="pt-4">
                    <FormsList statusFilter={['ממתין לאישור מורה', 'ממתין לאישור מנהל']} />
                </TabsContent>
                <TabsContent value="approved" className="pt-4">
                    <FormsList statusFilter={['מאושר']} />
                </TabsContent>
                <TabsContent value="drafts" className="pt-4">
                    <FormsList statusFilter={['טיוטה']} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
