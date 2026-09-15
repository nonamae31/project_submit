'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

const Joyride = dynamic(() => import('react-joyride').then(mod => mod.Joyride as any), { ssr: false }) as any;

export function BoardTour() {
  const [run, setRun] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenBoardTour');
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses = ['finished', 'skipped'];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenBoardTour', 'true');
    }
  };

  const steps: any[] = [
    {
      target: '#tour-step-1',
      content: 'Chào mừng bạn đến với Bảng Kanban! Đây là nơi quản lý toàn bộ công việc của dự án.',
      disableBeacon: true,
    },
    {
      target: '#tour-step-2',
      content: 'Bạn có thể kéo và thả các thẻ Task giữa các cột để thay đổi trạng thái công việc nhanh chóng.',
    },
    {
      target: '#tour-step-3',
      content: 'Click vào thẻ Task để xem chi tiết, nộp bài, hoặc yêu cầu AI đánh giá.',
    }
  ];

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          zIndex: 1000,
          backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
          textColor: theme === 'dark' ? '#fff' : '#18181b',
        },
      }}
    />
  );
}
