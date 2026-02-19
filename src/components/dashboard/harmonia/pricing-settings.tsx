'use client';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupText } from "@/components/ui/input-group";
import { Save } from "lucide-react";

const pricingSchema = z.object({
  baseRatePerLesson: z.object({
    '30': z.coerce.number().min(0, "מחיר חייב להיות חיובי"),
    '45': z.coerce.number().min(0, "מחיר חייב להיות חיובי"),
    '60': z.coerce.number().min(0, "מחיר חייב להיות חיובי"),
  }),
  discounts: z.object({
    pack5: z.coerce.number().min(0).max(100, "הנחה חייבת להיות בין 0-100"),
    pack10: z.coerce.number().min(0).max(100, "הנחה חייבת להיות בין 0-100"),
    yearly: z.coerce.number().min(0).max(100, "הנחה חייבת להיות בין 0-100"),
    sibling: z.coerce.number().min(0).max(100, "הנחה חייבת להיות בין 0-100"),
  }),
  adHocPremium: z.coerce.number().min(0, "פרמיה חייבת להיות מספר חיובי"),
  trialPrice: z.coerce.number().min(0, "מחיר חייב להיות חיובי"),
});

type PricingFormData = z.infer<typeof pricingSchema>;

export function PricingSettings() {
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();

    const currentConservatorium = conservatoriums.find(c => c.id === user?.conservatoriumId);

    const form = useForm<PricingFormData>({
        resolver: zodResolver(pricingSchema),
        defaultValues: currentConservatorium?.pricingConfig || {
            baseRatePerLesson: { '30': 0, '45': 0, '60': 0 },
            discounts: { pack5: 0, pack10: 0, yearly: 0, sibling: 0 },
            adHocPremium: 0,
            trialPrice: 0,
        },
    });

    const onSubmit = (data: PricingFormData) => {
        if (!currentConservatorium) return;
        updateConservatorium({ ...currentConservatorium, pricingConfig: data });
        toast({ title: 'הגדרות התמחור עודכנו בהצלחה!' });
        form.reset(data); // To reset the dirty state
    };
    
    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>תעריפי שיעורים בסיסיים</CardTitle>
                            <CardDescription>קבע את מחיר הבסיס לשיעור בודד לפי אורך.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <FormField control={form.control} name="baseRatePerLesson.30" render={({ field }) => ( <FormItem> <FormLabel>שיעור של 30 דקות</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="baseRatePerLesson.45" render={({ field }) => ( <FormItem> <FormLabel>שיעור של 45 דקות</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="baseRatePerLesson.60" render={({ field }) => ( <FormItem> <FormLabel>שיעור של 60 דקות</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem> )} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>הנחות חבילה</CardTitle>
                            <CardDescription>הגדר את אחוזי ההנחה עבור רכישת חבילות וזכאויות אחרות.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <FormField control={form.control} name="discounts.pack5" render={({ field }) => ( <FormItem> <FormLabel>הנחת חבילת 5</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="discounts.pack10" render={({ field }) => ( <FormItem> <FormLabel>הנחת חבילת 10</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="discounts.yearly" render={({ field }) => ( <FormItem> <FormLabel>הנחת מנוי שנתי</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="discounts.sibling" render={({ field }) => ( <FormItem> <FormLabel>הנחת אח/ות</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem> )} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>תמחור מיוחד</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-3 gap-4">
                             <FormField control={form.control} name="trialPrice" render={({ field }) => ( <FormItem> <FormLabel>מחיר שיעור ניסיון</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem> )} />
                             <FormField control={form.control} name="adHocPremium" render={({ field }) => ( <FormItem> <FormLabel>תוספת לשיעור בודד</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem> )} />
                        </CardContent>
                    </Card>
                </div>
                 <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={!form.formState.isDirty}>
                        <Save className="me-2 h-4 w-4" />
                        שמור שינויים
                    </Button>
                </div>
            </form>
        </FormProvider>
    );
}
