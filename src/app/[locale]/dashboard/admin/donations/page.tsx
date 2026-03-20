'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useAdminGuard } from '@/hooks/use-admin-guard';
import { useToast } from '@/hooks/use-toast';
import { Heart, Info, Trash2 } from 'lucide-react';
import type { AnonymizedStudentStory, ConservatoriumDonations } from '@/lib/types';

export default function AdminDonationsPage() {
  const { user, isLoading } = useAdminGuard();
  const { conservatoriums } = useAuth();
  const t = useTranslations('DonationsSettings');
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar';
  const { toast } = useToast();

  // Find the conservatorium for the current admin
  const cons = conservatoriums?.find((c) => c.id === user?.conservatoriumId);
  const donations: ConservatoriumDonations | undefined = cons?.donations;

  // Local form state
  const [section46Enabled, setSection46Enabled] = useState(donations?.section46Enabled ?? false);
  const [section46Number, setSection46Number] = useState(donations?.section46ApprovalNumber ?? '');
  const [section46Expiry, setSection46Expiry] = useState(donations?.section46ExpiryDate ?? '');
  const [annualTarget, setAnnualTarget] = useState(donations?.annualDonationTarget ?? 0);
  const [platformWeight, setPlatformWeight] = useState(donations?.platformWeightAdjustment ?? 0);
  const [stories, setStories] = useState<AnonymizedStudentStory[]>(
    donations?.featuredStudentStories ?? [],
  );

  // New story form state
  const [newInstrument, setNewInstrument] = useState('');
  const [newAgeRange, setNewAgeRange] = useState('');
  const [newStoryText, setNewStoryText] = useState('');

  if (isLoading || !user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  function handleAddStory() {
    if (!newInstrument || !newAgeRange || !newStoryText) return;
    const story: AnonymizedStudentStory = {
      id: `story-${Date.now()}`,
      instrument: newInstrument,
      ageRange: newAgeRange,
      storyText: { he: newStoryText },
      addedAt: new Date().toISOString(),
    };
    setStories((prev) => [...prev, story]);
    setNewInstrument('');
    setNewAgeRange('');
    setNewStoryText('');
  }

  function handleRemoveStory(id: string) {
    setStories((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSave() {
    // TODO: connect to db.conservatoriums.update() when server action is available
    toast({
      title: t('savedSuccess'),
    });
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Heart className="h-7 w-7 text-rose-500" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        </div>
      </div>

      {/* Section 46 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('section46')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={section46Enabled}
              onCheckedChange={setSection46Enabled}
              id="section46-toggle"
            />
            <Label htmlFor="section46-toggle">{t('section46')}</Label>
          </div>

          {section46Enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section46-number">{t('section46Number')}</Label>
                <Input
                  id="section46-number"
                  value={section46Number}
                  onChange={(e) => setSection46Number(e.target.value)}
                  placeholder="580123456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section46-expiry">{t('section46Expiry')}</Label>
                <Input
                  id="section46-expiry"
                  type="month"
                  dir="ltr"
                  value={section46Expiry}
                  onChange={(e) => setSection46Expiry(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Annual Target */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('annualTarget')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <Input
              type="number"
              min={0}
              value={annualTarget}
              onChange={(e) => setAnnualTarget(Number(e.target.value))}
              className="font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Platform Weight */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{t('platformWeight')}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t('platformWeightTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-md">
            <Slider
              min={-10}
              max={10}
              step={1}
              value={[platformWeight]}
              onValueChange={([v]) => setPlatformWeight(v)}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>-10</span>
              <span className="font-medium text-foreground">{platformWeight}</span>
              <span>+10</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Need Score (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('currentScore')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-primary">
              {(donations?.needScore ?? 0).toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('lastUpdated')}:{' '}
            {donations?.needScoreUpdatedAt
              ? new Date(donations.needScoreUpdatedAt).toLocaleDateString(locale, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : t('never')}
          </p>
        </CardContent>
      </Card>

      {/* Student Stories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('stories')}</CardTitle>
          <CardDescription>{t('noStories')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stories.length > 0 && (
            <div className="space-y-3">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <span>{story.instrument}</span>
                      <span>{story.ageRange}</span>
                    </div>
                    <p className="text-sm">{story.storyText.he}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStory(story.id)}
                    aria-label={t('removeStory')}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add Story Form */}
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="story-instrument" className="text-sm">
                  {t('storyInstrument')}
                </Label>
                <Input
                  id="story-instrument"
                  value={newInstrument}
                  onChange={(e) => setNewInstrument(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="story-age" className="text-sm">
                  {t('storyAgeRange')}
                </Label>
                <Input
                  id="story-age"
                  value={newAgeRange}
                  onChange={(e) => setNewAgeRange(e.target.value)}
                  placeholder="10-12"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="story-text" className="text-sm">
                {t('storyText')}
              </Label>
              <Input
                id="story-text"
                value={newStoryText}
                onChange={(e) => setNewStoryText(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddStory}
              disabled={!newInstrument || !newAgeRange || !newStoryText}
            >
              {t('addStory')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} size="lg">
          {t('save')}
        </Button>
      </div>
    </div>
  );
}
