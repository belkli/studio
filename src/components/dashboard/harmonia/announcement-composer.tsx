'use client';

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const announcementSchema = z.object({
  title: z.string().min(5, "הכותרת חייבת להכיל לפחות 5 תווים."),
  body: z.string().min(10, "גוף ההודעה חייב להכיל לפחות 10 תווים."),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'PARENTS', 'TEACHERS']),
  channels: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "חובה לבחור לפחות ערוץ הפצה אחד.",
  }),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

const channelOptions = [
    { id: 'IN_APP', label: 'התראה במערכת' },
    { id: 'EMAIL', label: 'אימייל' },
    { id: 'SMS', label: 'SMS' },
];

export function AnnouncementComposer() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      body: "",
      targetAudience: "ALL",
      channels: ["IN_APP", "EMAIL"],
    },
  });

  const onSubmit = (data: AnnouncementFormData) => {
    console.log("Sending announcement:", data);
    toast({
      title: "ההכרזה נשלחה בהצלחה!",
      description: `ההודעה "${data.title}" נשלחה לקהל היעד הנבחר.`,
    });
    form.reset();
  };
  
  if (!user || (user.role !== 'conservatorium_admin' && user.role !== 'site_admin')) {
    return <p>אין לך הרשאה לבצע פעולה זו.</p>;
  }

  return (
    <Card>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>יצירת הכרזה</CardTitle>
            <CardDescription>מלא את פרטי ההודעה שברצונך לשלוח.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>כותרת</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: תזכורת על חופשת חנוכה" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תוכן ההודעה</FormLabel>
                  <FormControl>
                    <Textarea placeholder="כתוב את תוכן ההכרזה כאן... ניתן להשתמש בתחביר Markdown בסיסי." rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>קהל יעד</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר למי לשלוח" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">כל המשתמשים</SelectItem>
                        <SelectItem value="STUDENTS">תלמידים</SelectItem>
                        <SelectItem value="PARENTS">הורים</SelectItem>
                        <SelectItem value="TEACHERS">מורים</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channels"
                render={() => (
                  <FormItem>
                    <FormLabel>ערוצי הפצה</FormLabel>
                    <div className="flex items-center space-x-4 space-x-reverse pt-2">
                      {channelOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="channels"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-x-reverse space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <Send className="me-2 h-4 w-4" />
              שלח הכרזה
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
