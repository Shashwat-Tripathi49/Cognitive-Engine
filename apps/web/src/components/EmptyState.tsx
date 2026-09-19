'use client';

import React from 'react';
import { EmptyState as UIEmptyState } from '@cognitive-engine/ui';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState(props: EmptyStateProps) {
  return <UIEmptyState {...props} />;
}
