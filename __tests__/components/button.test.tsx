import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

describe('Button Component', () => {
  it('should render with default props', () => {
    const { getByRole } = render(
      <Button>
        <Text>Click me</Text>
      </Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should render button text correctly', () => {
    const { getByText } = render(
      <Button>
        <Text>Test Button</Text>
      </Button>
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should handle onPress events', () => {
    const mockOnPress = jest.fn();
    
    const { getByRole } = render(
      <Button onPress={mockOnPress}>
        <Text>Clickable Button</Text>
      </Button>
    );
    
    const button = getByRole('button');
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should apply variant styles correctly', () => {
    const { getByRole: getDefault } = render(
      <Button variant="default">
        <Text>Default</Text>
      </Button>
    );
    
    const { getByRole: getDestructive } = render(
      <Button variant="destructive">
        <Text>Destructive</Text>
      </Button>
    );
    
    const { getByRole: getOutline } = render(
      <Button variant="outline">
        <Text>Outline</Text>
      </Button>
    );

    expect(getDefault('button')).toBeTruthy();
    expect(getDestructive('button')).toBeTruthy();
    expect(getOutline('button')).toBeTruthy();
  });

  it('should apply size variants correctly', () => {
    const { getByRole: getDefault } = render(
      <Button size="default">
        <Text>Default Size</Text>
      </Button>
    );
    
    const { getByRole: getSmall } = render(
      <Button size="sm">
        <Text>Small</Text>
      </Button>
    );
    
    const { getByRole: getLarge } = render(
      <Button size="lg">
        <Text>Large</Text>
      </Button>
    );

    expect(getDefault('button')).toBeTruthy();
    expect(getSmall('button')).toBeTruthy();
    expect(getLarge('button')).toBeTruthy();
  });

  it('should handle disabled state', () => {
    const mockOnPress = jest.fn();
    
    const { getByRole } = render(
      <Button onPress={mockOnPress} disabled>
        <Text>Disabled Button</Text>
      </Button>
    );
    
    const button = getByRole('button');
    fireEvent.press(button);
    
    // Should not call onPress when disabled
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('should render with custom className', () => {
    const { getByRole } = render(
      <Button className="custom-class">
        <Text>Custom Button</Text>
      </Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('should render ghost variant correctly', () => {
    const { getByRole } = render(
      <Button variant="ghost">
        <Text>Ghost Button</Text>
      </Button>
    );
    
    expect(getByRole('button')).toBeTruthy();
  });

  it('should render link variant correctly', () => {
    const { getByRole } = render(
      <Button variant="link">
        <Text>Link Button</Text>
      </Button>
    );
    
    expect(getByRole('button')).toBeTruthy();
  });

  it('should render secondary variant correctly', () => {
    const { getByRole } = render(
      <Button variant="secondary">
        <Text>Secondary Button</Text>
      </Button>
    );
    
    expect(getByRole('button')).toBeTruthy();
  });

  it('should handle icon size variant', () => {
    const { getByRole } = render(
      <Button size="icon">
        <Text>🎯</Text>
      </Button>
    );
    
    expect(getByRole('button')).toBeTruthy();
  });

  it('should handle multiple press events', () => {
    const mockOnPress = jest.fn();
    
    const { getByRole } = render(
      <Button onPress={mockOnPress}>
        <Text>Multi-press Button</Text>
      </Button>
    );
    
    const button = getByRole('button');
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(button);
    
    expect(mockOnPress).toHaveBeenCalledTimes(3);
  });

  it('should render without children', () => {
    const { getByRole } = render(<Button />);
    expect(getByRole('button')).toBeTruthy();
  });
});
