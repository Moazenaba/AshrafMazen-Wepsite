import { fireEvent } from '@testing-library/react';

// Submits the first form inside `container` the way a click on its save button does, skipping the browser's own
// field checks so the component's own rules and messages are what is tested.
export const submitForm = (container: HTMLElement) => {
  const form = container.querySelector('form');
  if (!form) throw new Error('no form');
  fireEvent.submit(form);
};
