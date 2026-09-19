'use client';

import React from 'react';
import { LoadingSkeleton as UILoadingSkeleton } from '@cognitive-engine/ui';

export interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton(props: LoadingSkeletonProps) {
  return <UILoadingSkeleton {...props} />;
}
