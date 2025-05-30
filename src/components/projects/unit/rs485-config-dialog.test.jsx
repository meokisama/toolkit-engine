import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RS485ConfigDialog } from './rs485-config-dialog';
import { useProjectDetail } from '@/contexts/project-detail-context';

// Mock the project detail context
jest.mock('@/contexts/project-detail-context');

// Mock the UI components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }) => <div data-testid="dialog-description">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, ...props }) => (
    <button onClick={onClick} data-variant={variant} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }) => (
    <div data-testid="tabs-content" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value, onClick }) => (
    <button data-testid="tabs-trigger" data-value={value} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/collapsible', () => ({
  Collapsible: ({ children, open, onOpenChange }) => (
    <div data-testid="collapsible" data-open={open}>
      {children}
    </div>
  ),
  CollapsibleContent: ({ children }) => (
    <div data-testid="collapsible-content">{children}</div>
  ),
  CollapsibleTrigger: ({ children, asChild }) => (
    <div data-testid="collapsible-trigger">{children}</div>
  ),
}));

jest.mock('@/components/ui/combobox', () => ({
  Combobox: ({ value, onValueChange, options, placeholder, ...props }) => (
    <select
      data-testid="combobox"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <h3 data-testid="card-title">{children}</h3>,
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children }) => <label data-testid="label">{children}</label>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input data-testid="input" {...props} />,
}));

jest.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down">▼</span>,
}));

const mockAirconCards = [
  { address: "1", name: "Living Room AC", description: "Main living room" },
  { address: "2", name: "Bedroom AC", description: "Master bedroom" },
  { address: "3", name: "", description: "Kitchen area" },
];

const mockConfig = [
  {
    baudrate: 9600,
    parity: 0,
    stop_bit: 0,
    board_id: 1,
    config_type: 10,
    num_slave_devs: 2,
    reserved: [0, 0, 0, 0, 0],
    slave_cfg: [
      {
        slave_id: 1,
        slave_group: 1,
        num_indoors: 2,
        indoor_group: [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      },
      {
        slave_id: 2,
        slave_group: 2,
        num_indoors: 1,
        indoor_group: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      }
    ]
  }
];

describe('RS485ConfigDialog', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    useProjectDetail.mockReturnValue({
      airconCards: mockAirconCards,
    });
    jest.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(
      <RS485ConfigDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        config={mockConfig}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('RS485 Configuration');
  });

  it('does not render dialog when closed', () => {
    render(
      <RS485ConfigDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        config={mockConfig}
        onSave={mockOnSave}
      />
    );

    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('displays aircon options in slave group combobox', () => {
    render(
      <RS485ConfigDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        config={mockConfig}
        onSave={mockOnSave}
      />
    );

    const comboboxes = screen.getAllByTestId('combobox');
    const slaveGroupCombobox = comboboxes.find(cb => 
      cb.querySelector('option[value="1"]')?.textContent === 'Living Room AC (1)'
    );
    
    expect(slaveGroupCombobox).toBeInTheDocument();
    expect(slaveGroupCombobox.querySelector('option[value="0"]')).toHaveTextContent('<Unused>');
    expect(slaveGroupCombobox.querySelector('option[value="1"]')).toHaveTextContent('Living Room AC (1)');
    expect(slaveGroupCombobox.querySelector('option[value="2"]')).toHaveTextContent('Bedroom AC (2)');
    expect(slaveGroupCombobox.querySelector('option[value="3"]')).toHaveTextContent('Aircon 3');
  });

  it('displays collapsible slaves instead of tabs', () => {
    render(
      <RS485ConfigDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        config={mockConfig}
        onSave={mockOnSave}
      />
    );

    // Should have collapsible components for slaves
    const collapsibles = screen.getAllByTestId('collapsible');
    expect(collapsibles.length).toBeGreaterThan(0);

    // Should have collapsible triggers
    const triggers = screen.getAllByTestId('collapsible-trigger');
    expect(triggers.length).toBeGreaterThan(0);
  });

  it('calls onSave when save button is clicked', () => {
    render(
      <RS485ConfigDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        config={mockConfig}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(expect.any(Array));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    render(
      <RS485ConfigDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        config={mockConfig}
        onSave={mockOnSave}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
