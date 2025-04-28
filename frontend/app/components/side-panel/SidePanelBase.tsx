'use client';

import { ReactNode } from 'react';
import { SidePanelLayout, SidePanelSection, SidePanelActionButton } from './common';
import { Divider } from '@/app/components/ui';

/**
 * Side panel configuration props
 */
export interface SidePanelConfig {
  title?: string;
  sections?: SidePanelSectionConfig[];
  actionButtons?: SidePanelActionConfig[];
  children?: ReactNode;
}

export interface SidePanelSectionConfig {
  title: string;
  content: ReactNode;
}

export interface SidePanelActionConfig {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  route?: string;
  appRoute?: string;
  bgColor?: string;
  hoverColor?: string;
  textColor?: string;
  ringColor?: string;
}

/**
 * Reusable base side panel component that can be configured for different routes
 * Reduces duplication across side panel implementations
 */
export function SidePanelBase({ title, sections = [], actionButtons = [], children }: SidePanelConfig) {
  return (
    <SidePanelLayout>
      {/* Action buttons section */}
      {actionButtons.length > 0 && (
        <>
          <div className='flex flex-col space-y-3'>
            {actionButtons.map((button, index) => (
              <SidePanelActionButton
                key={`action-${index}`}
                label={button.label}
                icon={button.icon}
                onClick={button.onClick}
                route={button.route}
                appRoute={button.appRoute}
                bgColor={button.bgColor || 'bg-blue-500'}
                hoverColor={button.hoverColor || 'hover:bg-blue-600'}
                textColor={button.textColor || 'text-white'}
                ringColor={button.ringColor || ''}
              />
            ))}
          </div>
          <Divider className='my-4' />
        </>
      )}

      {/* Title section */}
      {title && <h2 className='mb-4 text-lg font-semibold text-slate-800'>{title}</h2>}

      {/* Custom children content */}
      {children}

      {/* Configurable sections */}
      {sections.map((section, index) => (
        <SidePanelSection key={`section-${index}`} title={section.title}>
          {section.content}
        </SidePanelSection>
      ))}
    </SidePanelLayout>
  );
}
