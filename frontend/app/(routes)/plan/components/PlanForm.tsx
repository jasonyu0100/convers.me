'use client';

import { Button } from '@/app/components/ui/buttons';
import { SelectField } from '@/app/components/ui/inputs/SelectField';
import { TextField } from '@/app/components/ui/inputs/TextField';
import { LoadingSpinner } from '@/app/components/ui/loading/LoadingSpinner';
import { PlanService } from '@/app/services';
import { plan } from '@/app/types/api-types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { usePlan } from '../hooks';

/**
 * Form component for creating a weekly plan
 */
export function PlanForm() {
  const { formState, errors, isSubmitting, hasGeneratedPlan, handleInputChange, handleTemplateToggle, handleGeneratePlan, handleSavePlan } = usePlan();

  // Fetch directories with templates
  const { data: directoriesResponse, isLoading: isLoadingDirectories } = useQuery({
    queryKey: ['directoriesWithTemplates'],
    queryFn: async () => {
      const response = await PlanService.getDirectoriesWithTemplates();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });

  // Process directories data to ensure it's in the correct format
  const directories = useMemo<plan.PlanDirectory[]>(() => {
    if (!directoriesResponse) return [];

    // Handle case where API returns {directories: [...]}
    if (directoriesResponse.directories) {
      return directoriesResponse.directories;
    }

    // Handle case where API returns array directly
    if (Array.isArray(directoriesResponse)) {
      return directoriesResponse.map((dir) => ({
        id: dir.id,
        name: dir.name,
        description: dir.description || 'No description',
        color: dir.color || 'blue',
        templates: Array.isArray(dir.templates)
          ? dir.templates.map((template) => ({
              id: template.id,
              name: template.name || template.title || 'Unnamed Template',
              templateCount: template.templateCount || template.step_count || 1,
            }))
          : [],
      }));
    }

    // Fallback
    return [];
  }, [directoriesResponse]);

  return (
    <div className='flex h-full w-full flex-col p-4 md:p-6'>
      <div className='flex-1 space-y-5 overflow-y-auto'>
        {/* Description */}
        <TextField
          label='Description'
          name='description'
          as='textarea'
          rows={3}
          value={formState.description}
          onChange={handleInputChange}
          placeholder='What kind of week are you planning for?'
          fullWidth
          disabled={isSubmitting}
          error={!!errors.description}
          errorText={errors.description}
        />

        {/* Goals */}
        <TextField
          label='Weekly Goals'
          name='goals'
          as='textarea'
          rows={3}
          value={formState.goals}
          onChange={handleInputChange}
          placeholder='What do you want to accomplish this week?'
          fullWidth
          disabled={isSubmitting}
          error={!!errors.goals}
          errorText={errors.goals}
        />

        {/* Effort Level */}
        <SelectField
          label='Effort Level'
          name='effort'
          value={formState.effort}
          onChange={handleInputChange}
          options={[
            { value: 'low', label: 'Low - Less demanding week' },
            { value: 'medium', label: 'Medium - Balanced workload' },
            { value: 'high', label: 'High - Challenging, busy week' },
          ]}
          fullWidth
          disabled={isSubmitting}
        />

        {/* Hours Allocation */}
        <div>
          <label htmlFor='hoursAllocation' className='mb-1 block text-sm font-medium text-slate-700'>
            Hours Available (per week)
          </label>
          <div className='flex items-center gap-4'>
            <div className='relative flex-1'>
              <input
                type='range'
                id='hoursAllocation'
                name='hoursAllocation'
                min='1'
                max='40'
                step='1'
                value={formState.hoursAllocation}
                onChange={handleInputChange}
                className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-blue-100 disabled:opacity-50'
                disabled={isSubmitting}
              />
              <div className='mt-1 flex w-full justify-between text-xs text-slate-500'>
                <span>1h</span>
                <span>10h</span>
                <span>20h</span>
                <span>30h</span>
                <span>40h</span>
              </div>
            </div>
            <div className='w-16'>
              <TextField
                name='hoursAllocation'
                type='number'
                value={formState.hoursAllocation.toString()}
                onChange={handleInputChange}
                min='1'
                max='40'
                error={!!errors.hoursAllocation}
                errorText={errors.hoursAllocation}
                inputSize='sm'
                className='w-16'
              />
            </div>
          </div>
        </div>

        {/* Directories with Templates */}
        <div>
          <label className='mb-2 block text-sm font-medium text-slate-700'>Directories (select to include templates)</label>

          {isLoadingDirectories ? (
            <div className='flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50'>
              <LoadingSpinner size='sm' text='Loading directories' />
            </div>
          ) : directories.length === 0 ? (
            <div className='flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50'>
              <p className='text-sm text-slate-500'>No directories with templates found</p>
            </div>
          ) : (
            <div className='mt-2 max-h-96 overflow-y-auto'>
              <div className='grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2'>
                {directories.map((directory) => (
                  <div
                    key={directory.id}
                    onClick={() => handleTemplateToggle(directory.id)}
                    className={`group relative h-40 w-full cursor-pointer overflow-hidden rounded-xl border transition ${
                      formState.directories.includes(directory.id)
                        ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-400'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    {/* Color Indicator */}
                    <div
                      className='absolute top-0 left-0 h-full w-1.5'
                      style={{
                        backgroundColor: directory.color ? `var(--color-${directory.color}-500, #3b82f6)` : '#3b82f6',
                      }}
                    ></div>

                    {/* Selection Badge */}
                    {formState.directories.includes(directory.id) && (
                      <div className='absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white'>
                        <svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3' viewBox='0 0 20 20' fill='currentColor'>
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                    )}

                    {/* Content */}
                    <div className='flex h-full flex-col p-4'>
                      <div className='flex items-start justify-between'>
                        <h3 className='line-clamp-1 text-sm font-medium text-slate-800'>{directory.name}</h3>
                        <div
                          className='ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium'
                          style={{
                            backgroundColor: directory.color ? `var(--color-${directory.color}-100, #dbeafe)` : '#dbeafe',
                            color: directory.color ? `var(--color-${directory.color}-800, #1e40af)` : '#1e40af',
                          }}
                        >
                          {directory.templates.length}
                        </div>
                      </div>

                      <p className='mt-1 line-clamp-2 text-xs text-slate-600'>{directory.description}</p>

                      {/* Templates Preview */}
                      <div className='mt-auto'>
                        <h4 className='mb-1 text-[10px] font-medium tracking-wider text-slate-500 uppercase'>Templates</h4>
                        <div className='flex max-h-12 flex-wrap gap-1.5 overflow-hidden'>
                          {directory.templates.slice(0, 3).map((template) => (
                            <div key={template.id} className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] whitespace-nowrap text-slate-700'>
                              {template.name}
                            </div>
                          ))}
                          {directory.templates.length > 3 && (
                            <div className='rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700'>+{directory.templates.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Auto-generate Process Checkbox */}
        <div className='mt-4 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm'>
          <div className='flex items-center'>
            <input
              type='checkbox'
              id='autoGenerateProcess'
              name='autoGenerateProcess'
              checked={formState.autoGenerateProcess || false}
              onChange={(e) =>
                handleInputChange({
                  target: { name: 'autoGenerateProcess', value: e.target.checked },
                } as React.ChangeEvent)
              }
              className='h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500'
              disabled={isSubmitting}
            />
            <label htmlFor='autoGenerateProcess' className='ml-2 block text-sm font-medium text-slate-700'>
              Auto-generate processes for events
            </label>
          </div>
          <p className='mt-1 pl-6 text-xs text-slate-500'>
            When enabled, we'll automatically create detailed process templates for each event in your schedule
          </p>
        </div>
      </div>

      {/* Action Buttons - Sticky footer */}
      <div className='sticky bottom-0 z-10 pt-6'>
        {!hasGeneratedPlan ? (
          <Button
            onClick={handleGeneratePlan}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            variant='primary'
            size='lg'
            fullWidth
            className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'></path>
                <path d='M12 6v6l4 2'></path>
              </svg>
            }
          >
            {isSubmitting ? 'Generating Your Plan...' : 'Generate Weekly Plan'}
          </Button>
        ) : (
          <div className='flex flex-col gap-4 sm:flex-row'>
            <Button
              onClick={handleSavePlan}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              variant='primary'
              size='md'
              fullWidth
              className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              icon={
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <rect x='3' y='4' width='18' height='18' rx='2' ry='2'></rect>
                  <line x1='16' y1='2' x2='16' y2='6'></line>
                  <line x1='8' y1='2' x2='8' y2='6'></line>
                  <line x1='3' y1='10' x2='21' y2='10'></line>
                </svg>
              }
            >
              {isSubmitting ? 'Saving to Calendar...' : 'Save to Calendar'}
            </Button>

            <Button
              onClick={handleGeneratePlan}
              disabled={isSubmitting}
              variant='outline'
              size='md'
              className='border-slate-200 text-slate-700 hover:border-slate-300'
              icon={
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M18 15l-6-6-6 6' />
                </svg>
              }
            >
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
