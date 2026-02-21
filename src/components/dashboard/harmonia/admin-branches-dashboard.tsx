'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { Branch } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Building2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslations } from 'next-intl';

export function AdminBranchesDashboard() {
    const { user, mockBranches, addBranch, conservatoriums } = useAuth();

    const conservatoriumBranches = useMemo(() => {
        if (!user) return [];
        if (user.role === 'site_admin') return mockBranches;
        return mockBranches.filter(b => b.conservatoriumId === user.conservatoriumId);
    }, [user, mockBranches]);
    
    // For now, add button is a placeholder
    const handleAddBranch = () => {
      console.log("Add new branch clicked");
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>רשימת סניפים</CardTitle>
                    <CardDescription>
                        {conservatoriumBranches.length} סניפים מוגדרים במערכת.
                    </CardDescription>
                </div>
                <Button onClick={handleAddBranch}>
                    <PlusCircle className="me-2 h-4 w-4" />
                    הוסף סניף חדש
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>שם הסניף</TableHead>
                            <TableHead>כתובת</TableHead>
                            {user?.role === 'site_admin' && <TableHead>קונסרבטוריון</TableHead>}
                            <TableHead className="text-left">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {conservatoriumBranches.map(branch => (
                            <TableRow key={branch.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-muted-foreground"/>
                                    {branch.name}
                                </TableCell>
                                <TableCell>{branch.address}</TableCell>
                                {user?.role === 'site_admin' && (
                                    <TableCell>
                                        {conservatoriums.find(c => c.id === branch.conservatoriumId)?.name || branch.conservatoriumId}
                                    </TableCell>
                                )}
                                <TableCell className="text-left">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>ערוך</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">מחק</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
