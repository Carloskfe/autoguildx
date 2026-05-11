'use client';

import { useEffect, useState } from 'react';
import { Joyride, EventData, STATUS, Step } from 'react-joyride';

export const TOUR_KEY = 'agx_tour_seen';

const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Welcome to AutoGuildX',
    content: 'Where experience, knowledge and passion come together around cars.',
  },
  {
    target: '#tour-nav-profile',
    placement: 'right',
    skipBeacon: true,
    title: 'Your Profile',
    content:
      'Showcase your work, earn a verified badge, and build your reputation in the automotive community.',
  },
  {
    target: '#tour-nav-market',
    placement: 'right',
    skipBeacon: true,
    title: 'Marketplace',
    content:
      'Buy, sell and discover parts, services and builds. List your own inventory or find exactly what your project needs.',
  },
  {
    target: '#tour-nav-courses',
    placement: 'right',
    skipBeacon: true,
    title: 'Courses',
    content:
      'Learn from experts or teach what you know. Complete courses and earn certificates that live on your profile.',
  },
  {
    target: '#tour-nav-feed',
    placement: 'right',
    skipBeacon: true,
    title: 'Feed',
    content:
      'Stay connected with the community. Share builds, react to posts, and follow the people who inspire you.',
  },
];

interface Props {
  run: boolean;
  onEnd: () => void;
}

export default function TourGuide({ run, onEnd }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEvent = (data: EventData) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_KEY, 'true');
      onEnd();
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      steps={STEPS}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      locale={{ last: 'Done', skip: 'Skip tour' }}
      options={{
        backgroundColor: '#1a1a1a',
        arrowColor: '#1a1a1a',
        overlayColor: 'rgba(0,0,0,0.75)',
        primaryColor: '#f97316',
        textColor: '#e5e7eb',
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'primary', 'skip'],
      }}
    />
  );
}
