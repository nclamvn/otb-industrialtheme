'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityTimeline, generateMockActivities } from './ActivityTimeline';

export function TimelineDemo() {
  const activities = generateMockActivities(15);
  const users = [
    { id: 'u1', name: 'John Smith' },
    { id: 'u2', name: 'Alice Wong' },
    { id: 'u3', name: 'Bob Lee' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#127749]" />
          Activity Timeline
        </CardTitle>
        <CardDescription>
          Track all user actions with filterable timeline
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ActivityTimeline
          activities={activities}
          users={users}
          showFilters
          groupByDate
          maxHeight="400px"
        />
      </CardContent>
    </Card>
  );
}
