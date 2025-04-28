import { LoginFormData } from '../../../types/login';

interface AuthSignupFieldsProps {
  formData: LoginFormData;
  updateField: (field: keyof LoginFormData, value: string) => void;
  disabled?: boolean;
}

export function AuthSignupFields({ formData, updateField, disabled = false }: AuthSignupFieldsProps) {
  return (
    <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
      <div className='space-y-2'>
        <label className='block text-sm font-medium text-slate-700' htmlFor='firstName'>
          First Name
        </label>
        <div className='relative'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400'>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
              <path fillRule='evenodd' d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' clipRule='evenodd' />
            </svg>
          </div>
          <input
            id='firstName'
            type='text'
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-white/80 py-3 pr-4 pl-11 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 focus:outline-none disabled:opacity-50'
            disabled={disabled}
            required
            placeholder='John'
            aria-required='true'
            autoComplete='given-name'
          />
        </div>
      </div>

      <div className='space-y-2'>
        <label className='block text-sm font-medium text-slate-700' htmlFor='lastName'>
          Last Name
        </label>
        <div className='relative'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400'>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
              <path fillRule='evenodd' d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' clipRule='evenodd' />
            </svg>
          </div>
          <input
            id='lastName'
            type='text'
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className='w-full rounded-xl border border-slate-200 bg-white/80 py-3 pr-4 pl-11 shadow-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 focus:outline-none disabled:opacity-50'
            disabled={disabled}
            required
            placeholder='Doe'
            aria-required='true'
            autoComplete='family-name'
          />
        </div>
      </div>
    </div>
  );
}
