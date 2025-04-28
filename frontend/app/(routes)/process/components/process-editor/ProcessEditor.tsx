import { PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Process, ProcessesSubStep } from '../../../../types/process';
import { useProcess } from '../../hooks';
import { StepInput } from './StepInput';
import { SubStepInput } from './SubStepInput';

export function ProcessEditor() {
  const { selectedList, isCreatingNewList, handleSaveList, handleDeleteList } = useProcess();

  type FormStep = {
    id?: string;
    content: string;
    completed?: boolean;
    subSteps: {
      id?: string;
      content: string;
      completed?: boolean;
    }[];
    isExpanded: boolean;
  };

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    steps: FormStep[];
  }>({
    title: '',
    description: '',
    steps: [{ content: '', subSteps: [], isExpanded: false }],
  });

  // Initialize form when selected list changes or when prefill data is available
  useEffect(() => {
    // Check for prefill data in sessionStorage when creating a new list
    if (isCreatingNewList && typeof window !== 'undefined') {
      const prefillDataString = sessionStorage.getItem('process_prefill_data');

      if (prefillDataString) {
        try {
          const prefillData = JSON.parse(prefillDataString);
          setFormData({
            title: prefillData.title || '',
            description: prefillData.description || '',
            steps: prefillData.steps?.map((step: any) => ({
              id: step.id,
              content: step.content,
              completed: step.completed || false,
              subSteps:
                step.subSteps?.map((subStep: any) => ({
                  id: subStep.id,
                  content: subStep.content,
                  completed: subStep.completed || false,
                })) || [],
              isExpanded: false,
            })) || [{ content: '', subSteps: [], isExpanded: false }],
          });

          // Clear prefill data from sessionStorage to avoid reusing it
          sessionStorage.removeItem('process_prefill_data');
          return;
        } catch (error) {
          console.error('Error parsing prefill data:', error);
        }
      }
    }

    if (selectedList) {
      setFormData({
        title: selectedList.title,
        description: selectedList.description || '',
        steps: selectedList.steps.map((step) => ({
          id: step.id,
          content: step.content,
          completed: step.completed,
          subSteps:
            step.subSteps?.map((subStep) => ({
              id: subStep.id,
              content: subStep.content,
              completed: subStep.completed,
            })) || [],
          isExpanded: false,
        })),
      });
    } else if (isCreatingNewList) {
      // Only set empty form data if we didn't already set prefill data
      if (!sessionStorage.getItem('process_prefill_data')) {
        setFormData({
          title: '',
          description: '',
          steps: [{ content: '', subSteps: [], isExpanded: false }],
        });
      }
    }
  }, [selectedList, isCreatingNewList]);

  const handleAddStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { content: '', subSteps: [], isExpanded: false }],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const handleStepChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? { ...step, content: value } : step)),
    }));
  };

  const handleAddSubStep = (stepIndex: number) => {
    setFormData((prev) => {
      const updatedSteps = [...prev.steps];
      if (!updatedSteps[stepIndex].isExpanded) {
        updatedSteps[stepIndex].isExpanded = true;
      }
      updatedSteps[stepIndex].subSteps = [...updatedSteps[stepIndex].subSteps, { content: '' }];
      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  };

  const handleRemoveSubStep = (stepIndex: number, subStepIndex: number) => {
    setFormData((prev) => {
      const updatedSteps = [...prev.steps];
      updatedSteps[stepIndex].subSteps = updatedSteps[stepIndex].subSteps.filter((_, i) => i !== subStepIndex);
      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  };

  const handleSubStepChange = (stepIndex: number, subStepIndex: number, value: string) => {
    setFormData((prev) => {
      const updatedSteps = [...prev.steps];
      updatedSteps[stepIndex].subSteps[subStepIndex].content = value;
      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  };

  const handleToggleStepExpanded = (stepIndex: number) => {
    setFormData((prev) => {
      const updatedSteps = [...prev.steps];
      updatedSteps[stepIndex].isExpanded = !updatedSteps[stepIndex].isExpanded;
      return {
        ...prev,
        steps: updatedSteps,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newList: Process = {
      id: selectedList?.id || `list-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      createdAt: selectedList?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: formData.steps
        .filter((step) => step.content.trim() !== '') // Filter out empty steps
        .map((step, index) => {
          const filteredSubSteps: ProcessesSubStep[] = step.subSteps
            .filter((subStep) => subStep.content.trim() !== '')
            .map((subStep, subIndex) => ({
              id: subStep.id || `substep-${Date.now()}-${index}-${subIndex}`,
              content: subStep.content,
              completed: subStep.completed || false,
            }));

          return {
            id: step.id || `step-${Date.now()}-${index}`,
            content: step.content,
            completed: step.completed || false,
            subSteps: filteredSubSteps.length > 0 ? filteredSubSteps : undefined,
          };
        }),
    };

    handleSaveList(newList);
  };

  return (
    <form onSubmit={handleSubmit} className='mx-auto w-full rounded-xl border border-slate-200 bg-white/80 p-8'>
      <div className='mb-6'>
        <input
          type='text'
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          className='w-full border-0 border-b-2 border-slate-200 p-2 text-2xl font-medium placeholder-gray-400 focus:border-blue-500 focus:ring-0'
          placeholder='Template Name'
          required
        />
      </div>

      <div className='mb-8'>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className='w-full resize-none border-0 border-b-2 border-slate-200 p-2 placeholder-gray-400 focus:border-blue-500 focus:ring-0'
          placeholder='Add a description...'
          rows={3}
        />
      </div>

      <div className='mb-8'>
        <div className='mb-4 flex flex-col space-y-4'>
          {formData.steps.map((step, stepIndex) => (
            <div key={stepIndex}>
              <StepInput
                stepIndex={stepIndex}
                value={step.content}
                hasSubSteps={step.subSteps.length > 0}
                isExpanded={step.isExpanded}
                onRemove={() => handleRemoveStep(stepIndex)}
                onChange={(value) => handleStepChange(stepIndex, value)}
                onAddSubStep={() => handleAddSubStep(stepIndex)}
                onToggleExpand={() => handleToggleStepExpanded(stepIndex)}
              />

              {step.isExpanded &&
                step.subSteps.map((subStep, subStepIndex) => (
                  <SubStepInput
                    key={subStepIndex}
                    stepIndex={stepIndex}
                    subStepIndex={subStepIndex}
                    value={subStep.content}
                    onRemove={() => handleRemoveSubStep(stepIndex, subStepIndex)}
                    onChange={(value) => handleSubStepChange(stepIndex, subStepIndex, value)}
                  />
                ))}
            </div>
          ))}
        </div>

        <button type='button' onClick={handleAddStep} className='mb-6 flex items-center text-blue-600 hover:text-blue-800'>
          <PlusIcon className='mr-1 h-4 w-4' />
          <span className='text-sm'>Add Step</span>
        </button>
      </div>

      <div className='flex justify-between'>
        {selectedList && (
          <button
            type='button'
            onClick={() => handleDeleteList(selectedList.id)}
            className='px-4 py-2 text-red-600 transition-colors duration-150 hover:text-red-800'
          >
            Delete Template
          </button>
        )}

        <button type='submit' className='rounded-md bg-blue-600 px-6 py-2 text-white transition-colors duration-150 hover:bg-blue-700'>
          {isCreatingNewList ? 'Create Process' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
