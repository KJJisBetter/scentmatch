import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  // Create a wrapper component that provides all necessary context
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <div data-testid='test-wrapper'>{children}</div>;
  };

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
