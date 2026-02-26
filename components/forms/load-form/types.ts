import type { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';

/**
 * Shared form methods passed to each wizard step component.
 * Uses `any` for form type since steps are used in both create and edit modes.
 */
export interface LoadFormMethods {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

/** Base props shared by all step components */
export interface LoadFormStepBaseProps {
  form: LoadFormMethods;
  isCreateMode: boolean;
  isMultiStop: boolean;
}
