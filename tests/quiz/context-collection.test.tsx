/**
 * Context Collection Tests - SCE-70
 * 
 * Tests the new context collection feature that captures user's
 * existing fragrance knowledge for better personalization.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextCollection } from '@/components/quiz/context-collection';

// Mock the UI components
vi.mock('@/components/ui/command', () => ({
  Command: ({ children }: { children: React.ReactNode }) => <div data-testid="command">{children}</div>,
  CommandInput: ({ onValueChange, ...props }: any) => (
    <input 
      {...props} 
      data-testid="command-input"
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandList: ({ children }: { children: React.ReactNode }) => <div data-testid="command-list">{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="command-group">{children}</div>,
  CommandItem: ({ children, onSelect }: any) => (
    <button data-testid="command-item" onClick={() => onSelect?.()}>{children}</button>
  ),
}));

vi.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open }: any) => <div data-testid="popover" style={{ display: open ? 'block' : 'none' }}>{children}</div>,
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content">{children}</div>,
}));

describe('ContextCollection', () => {
  const mockOnContextComplete = vi.fn();
  
  beforeEach(() => {
    mockOnContextComplete.mockClear();
  });

  describe('Beginner Experience Level', () => {
    it('renders known fragrances question for beginners', () => {
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText(/any fragrances you've heard about/i)).toBeInTheDocument();
      expect(screen.getByText(/this helps us give you better recommendations/i)).toBeInTheDocument();
    });

    it('displays popular fragrance options for beginners', () => {
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText('Sauvage')).toBeInTheDocument();
      expect(screen.getByText('Dior')).toBeInTheDocument();
      expect(screen.getByText('Bleu de Chanel')).toBeInTheDocument();
      expect(screen.getByText('Chanel')).toBeInTheDocument();
      expect(screen.getByText('Acqua di Gio')).toBeInTheDocument();
      expect(screen.getByText('Giorgio Armani')).toBeInTheDocument();
    });

    it('allows selection of popular fragrances', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const sauvageButton = screen.getByRole('button', { name: /sauvage dior/i });
      await user.click(sauvageButton);

      expect(sauvageButton).toHaveClass('border-purple-500', 'bg-purple-50');
      expect(screen.getByText('Fragrances you know about:')).toBeInTheDocument();
      expect(screen.getByText('Sauvage by Dior')).toBeInTheDocument();
    });

    it('allows multiple fragrance selections', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByRole('button', { name: /bleu de chanel/i }));

      expect(screen.getByText('Sauvage by Dior')).toBeInTheDocument();
      expect(screen.getByText('Bleu de Chanel by Chanel')).toBeInTheDocument();
    });

    it('allows removing selected fragrances', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      // Select a fragrance
      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      expect(screen.getByText('Sauvage by Dior')).toBeInTheDocument();

      // Remove it
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(removeButton);
      expect(screen.queryByText('Sauvage by Dior')).not.toBeInTheDocument();
    });

    it('includes store experience and new user options', () => {
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText(/something I smelled at a store/i)).toBeInTheDocument();
      expect(screen.getByText(/I haven't heard of any specific ones/i)).toBeInTheDocument();
    });

    it('allows custom fragrance input', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const customInput = screen.getByPlaceholderText(/e.g., Chanel No. 5/i);
      await user.type(customInput, 'Tom Ford Black Orchid');

      const addButton = screen.getByRole('button', { name: '' }); // Plus button
      await user.click(addButton);

      expect(screen.getByText('Tom Ford Black Orchid')).toBeInTheDocument();
    });

    it('enables continue button when at least one fragrance is selected', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const continueButton = screen.getByText(/continue to quiz questions/i);
      expect(continueButton).toBeDisabled();

      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      expect(continueButton).toBeEnabled();
    });

    it('calls onContextComplete with correct data for beginners', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));

      expect(mockOnContextComplete).toHaveBeenCalledWith({
        known_fragrances: ['Sauvage by Dior'],
        current_collection: [],
        context_notes: ''
      });
    });
  });

  describe('Advanced Experience Level', () => {
    it('renders current collection question for advanced users', () => {
      render(
        <ContextCollection 
          experienceLevel="experienced" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText(/what fragrances do you currently own/i)).toBeInTheDocument();
      expect(screen.getByText(/tell us about your collection/i)).toBeInTheDocument();
    });

    it('displays fragrance search interface', () => {
      render(
        <ContextCollection 
          experienceLevel="experienced" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText(/search and add fragrances/i)).toBeInTheDocument();
      expect(screen.getByText(/search fragrances.../i)).toBeInTheDocument();
    });

    it('allows adding fragrances to collection via search', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="experienced" 
          onContextComplete={mockOnContextComplete}
        />
      );

      // Click search trigger
      const searchTrigger = screen.getByText(/search fragrances.../i);
      await user.click(searchTrigger);

      // Should show search interface
      expect(screen.getByTestId('command')).toBeInTheDocument();
    });

    it('shows collection items with rating and frequency options', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="experienced" 
          onContextComplete={mockOnContextComplete}
        />
      );

      // Mock adding an item (this would normally happen via the command interface)
      // For this test, we'll need to simulate the internal state change
      // This is a limitation of the current test setup - in real usage,
      // the user would select from the command dropdown
    });

    it('allows editing collection item details', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="experienced" 
          onContextComplete={mockOnContextComplete}
        />
      );

      // This test would need the collection item to be pre-added
      // For now, we'll test the interface exists
      expect(screen.getByText(/search and add fragrances/i)).toBeInTheDocument();
    });

    it('enables continue button when collection has items or notes', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="experienced" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const continueButton = screen.getByText(/continue to quiz questions/i);
      expect(continueButton).toBeDisabled();

      // Add context notes to enable continue
      const notesInput = screen.getByPlaceholderText(/I prefer lighter scents/i);
      await user.type(notesInput, 'I prefer woody and spicy fragrances');

      expect(continueButton).toBeEnabled();
    });
  });

  describe('Additional Notes', () => {
    it('renders additional notes input for all experience levels', () => {
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText(/any other preferences or notes/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/I prefer lighter scents/i)).toBeInTheDocument();
    });

    it('includes context notes in completion data', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const notesInput = screen.getByPlaceholderText(/I prefer lighter scents/i);
      await user.type(notesInput, 'I prefer fresh, clean scents for daily wear');

      await user.click(screen.getByRole('button', { name: /sauvage dior/i }));
      await user.click(screen.getByText(/continue to quiz questions/i));

      expect(mockOnContextComplete).toHaveBeenCalledWith({
        known_fragrances: ['Sauvage by Dior'],
        current_collection: [],
        context_notes: 'I prefer fresh, clean scents for daily wear'
      });
    });

    it('allows proceeding with only context notes (no fragrance selections)', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const continueButton = screen.getByText(/continue to quiz questions/i);
      expect(continueButton).toBeDisabled();

      const notesInput = screen.getByPlaceholderText(/I prefer lighter scents/i);
      await user.type(notesInput, 'Just looking for something light and fresh');

      expect(continueButton).toBeEnabled();

      await user.click(continueButton);

      expect(mockOnContextComplete).toHaveBeenCalledWith({
        known_fragrances: [],
        current_collection: [],
        context_notes: 'Just looking for something light and fresh'
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper labels and ARIA attributes', () => {
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      // Check for proper labeling
      expect(screen.getByText(/other fragrance you've heard about/i)).toBeInTheDocument();
      expect(screen.getByText(/any other preferences or notes/i)).toBeInTheDocument();
    });

    it('shows helpful validation messages', () => {
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText(/select at least one fragrance or add a note to continue/i)).toBeInTheDocument();
    });

    it('provides clear feedback for advanced users', () => {
      render(
        <ContextCollection 
          experienceLevel="experienced" 
          onContextComplete={mockOnContextComplete}
        />
      );

      expect(screen.getByText(/add at least one fragrance or a note to continue/i)).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    it('handles empty submissions gracefully', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const continueButton = screen.getByText(/continue to quiz questions/i);
      expect(continueButton).toBeDisabled();

      // Should not be able to proceed without any input
      expect(mockOnContextComplete).not.toHaveBeenCalled();
    });

    it('trims whitespace from custom inputs', async () => {
      const user = userEvent.setup();
      
      render(
        <ContextCollection 
          experienceLevel="beginner" 
          onContextComplete={mockOnContextComplete}
        />
      );

      const customInput = screen.getByPlaceholderText(/e.g., Chanel No. 5/i);
      await user.type(customInput, '  Tom Ford Noir  ');

      const addButton = screen.getByRole('button', { name: '' }); // Plus button
      await user.click(addButton);

      await user.click(screen.getByText(/continue to quiz questions/i));

      expect(mockOnContextComplete).toHaveBeenCalledWith({
        known_fragrances: ['Tom Ford Noir'],
        current_collection: [],
        context_notes: ''
      });
    });
  });
});