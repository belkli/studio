'use client';
import { useMemo } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save } from "lucide-react";
import { useTranslations } from "next-intl";

const getPricingSchema = (t: any) => z.object({
    baseRatePerLesson: z.object({
        '30': z.coerce.number().min(0, t('validation.positive')),
        '45': z.coerce.number().min(0, t('validation.positive')),
        '60': z.coerce.number().min(0, t('validation.positive')),
    }),
    discounts: z.object({
        pack5: z.coerce.number().min(0).max(100, t('validation.percent')),
        pack10: z.coerce.number().min(0).max(100, t('validation.percent')),
        yearly: z.coerce.number().min(0).max(100, t('validation.percent')),
        sibling: z.coerce.number().min(0).max(100, t('validation.percent')),
    }),
    adHocPremium: z.coerce.number().min(0, t('validation.positive')),
    trialPrice: z.coerce.number().min(0, t('validation.positive')),
});

type PricingFormData = {
    baseRatePerLesson: { '30': number; '45': number; '60': number;[key: string]: number };
    discounts: { pack5: number; pack10: number; yearly: number; sibling: number;[key: string]: number };
    adHocPremium: number;
    trialPrice: number;
};

export function PricingSettings() {
    const { user, conservatoriums, updateConservatorium } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('PricingSettings');

    const pricingSchema = useMemo(() => getPricingSchema(t), [t]);

    const currentConservatorium = conservatoriums.find(c => c.id === user?.conservatoriumId);

    const form = useForm<PricingFormData>({
        resolver: zodResolver(pricingSchema) as any,
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
        toast({ title: t('success') });
        form.reset(data); // To reset the dirty state
    };

    const otherConservatoriums = conservatoriums.filter(c => c.id !== user?.conservatoriumId);

    return (
        <>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('baseRates.title')}</CardTitle>
                                <CardDescription>{t('baseRates.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="baseRatePerLesson.30" render={({ field }) => (<FormItem> <FormLabel>{t('baseRates.min30')}</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem>)} />
                                <FormField control={form.control} name="baseRatePerLesson.45" render={({ field }) => (<FormItem> <FormLabel>{t('baseRates.min45')}</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem>)} />
                                <FormField control={form.control} name="baseRatePerLesson.60" render={({ field }) => (<FormItem> <FormLabel>{t('baseRates.min60')}</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem>)} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('discounts.title')}</CardTitle>
                                <CardDescription>{t('discounts.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormField control={form.control} name="discounts.pack5" render={({ field }) => (<FormItem> <FormLabel>{t('discounts.pack5')}</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem>)} />
                                <FormField control={form.control} name="discounts.pack10" render={({ field }) => (<FormItem> <FormLabel>{t('discounts.pack10')}</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem>)} />
                                <FormField control={form.control} name="discounts.yearly" render={({ field }) => (<FormItem> <FormLabel>{t('discounts.yearly')}</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem>)} />
                                <FormField control={form.control} name="discounts.sibling" render={({ field }) => (<FormItem> <FormLabel>{t('discounts.sibling')}</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem>)} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('special.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="trialPrice" render={({ field }) => (<FormItem> <FormLabel>{t('special.trial')}</FormLabel> <InputGroup> <InputGroupText>₪</InputGroupText> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> </InputGroup> <FormMessage /> </FormItem>)} />
                                <FormField control={form.control} name="adHocPremium" render={({ field }) => (<FormItem> <FormLabel>{t('special.adHoc')}</FormLabel> <InputGroup> <FormControl><Input type="number" {...field} className="rounded-s-none" /></FormControl> <InputGroupText>%</InputGroupText> </InputGroup> <FormMessage /> </FormItem>)} />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex justify-end mt-6 mb-8">
                        <Button type="submit" disabled={!form.formState.isDirty}>
                            <Save className="me-2 h-4 w-4" />
                            {t('save')}
                        </Button>
                    </div>
                </form>
            </FormProvider>

            {
                otherConservatoriums.length > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle>{t('comparison.title')}</CardTitle>
                            <CardDescription>{t('comparison.description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-[var(--text-align)]">{t('comparison.branch')}</TableHead>
                                        <TableHead className="text-[var(--text-align)]">{t('comparison.min30')}</TableHead>
                                        <TableHead className="text-[var(--text-align)]">{t('comparison.min45')}</TableHead>
                                        <TableHead className="text-[var(--text-align)]">{t('comparison.min60')}</TableHead>
                                        <TableHead className="text-[var(--text-align)]">{t('comparison.pack5')}</TableHead>
                                        <TableHead className="text-[var(--text-align)]">{t('comparison.yearly')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {otherConservatoriums.map((cons) => {
                                        const config = cons.pricingConfig || {
                                            baseRatePerLesson: { '30': 80, '45': 100, '60': 120 },
                                            discounts: { pack5: 5, pack10: 10, yearly: 15, sibling: 10 }
                                        }; // Fallback to realistic defaults if not set in mock
                                        return (
                                            <TableRow key={cons.id}>
                                                <TableCell className="font-medium">{cons.name}</TableCell>
                                                <TableCell>₪{config.baseRatePerLesson?.['30']}</TableCell>
                                                <TableCell>₪{config.baseRatePerLesson?.['45']}</TableCell>
                                                <TableCell>₪{config.baseRatePerLesson?.['60']}</TableCell>
                                                <TableCell>{config.discounts?.pack5}%</TableCell>
                                                <TableCell>{config.discounts?.yearly}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )
            }
        </>
    );
}
