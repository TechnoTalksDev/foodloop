import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '@/components/ui/product-card';

// Mock image for testing
const mockImage = { uri: 'https://example.com/test-image.jpg' };

const mockProductProps = {
  image: mockImage,
  name: 'Organic Apples',
  business: 'Green Farm',
  price: 5.99,
  originalPrice: 7.99,
  discount: '25% OFF',
  eco: 'Saves 2kg CO₂'
};

describe('ProductCard Component', () => {
  it('should render product information correctly', () => {
    const { getByText } = render(
      <ProductCard {...mockProductProps} />
    );

    expect(getByText('Organic Apples')).toBeTruthy();
    expect(getByText('Green Farm')).toBeTruthy();
    expect(getByText('$5.99')).toBeTruthy();
    expect(getByText('$7.99')).toBeTruthy();
    expect(getByText('25% OFF')).toBeTruthy();
    expect(getByText('🌱 Saves 2kg CO₂')).toBeTruthy();
  });

  it('should handle onPress events', () => {
    const mockOnPress = jest.fn();
    
    const { getByRole } = render(
      <ProductCard {...mockProductProps} onPress={mockOnPress} />
    );

    const card = getByRole('button');
    fireEvent.press(card);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should display price with correct formatting', () => {
    const propsWithDecimals = {
      ...mockProductProps,
      price: 10.5,
      originalPrice: 15.75
    };

    const { getByText } = render(
      <ProductCard {...propsWithDecimals} />
    );

    expect(getByText('$10.50')).toBeTruthy();
    expect(getByText('$15.75')).toBeTruthy();
  });

  it('should display whole numbers with .00 formatting', () => {
    const propsWithWholeNumbers = {
      ...mockProductProps,
      price: 8,
      originalPrice: 12
    };

    const { getByText } = render(
      <ProductCard {...propsWithWholeNumbers} />
    );

    expect(getByText('$8.00')).toBeTruthy();
    expect(getByText('$12.00')).toBeTruthy();
  });

  it('should render without onPress handler', () => {
    const { getByRole } = render(
      <ProductCard {...mockProductProps} />
    );

    const card = getByRole('button');
    expect(card).toBeTruthy();
    
    // Should not crash when pressed without onPress handler
    fireEvent.press(card);
  });

  it('should handle different discount formats', () => {
    const propsWithPercentage = {
      ...mockProductProps,
      discount: '50% OFF'
    };

    const { getByText } = render(
      <ProductCard {...propsWithPercentage} />
    );

    expect(getByText('50% OFF')).toBeTruthy();
  });

  it('should handle different eco messages', () => {
    const propsWithDifferentEco = {
      ...mockProductProps,
      eco: 'Prevents 500g waste'
    };

    const { getByText } = render(
      <ProductCard {...propsWithDifferentEco} />
    );

    expect(getByText('🌱 Prevents 500g waste')).toBeTruthy();
  });

  it('should handle long product names', () => {
    const propsWithLongName = {
      ...mockProductProps,
      name: 'Super Organic Free-Range Hormone-Free Grass-Fed Premium Apples'
    };

    const { getByText } = render(
      <ProductCard {...propsWithLongName} />
    );

    expect(getByText('Super Organic Free-Range Hormone-Free Grass-Fed Premium Apples')).toBeTruthy();
  });

  it('should handle long business names', () => {
    const propsWithLongBusiness = {
      ...mockProductProps,
      business: 'Sustainable Organic Community-Supported Agriculture Farm'
    };

    const { getByText } = render(
      <ProductCard {...propsWithLongBusiness} />
    );

    expect(getByText('Sustainable Organic Community-Supported Agriculture Farm')).toBeTruthy();
  });

  it('should handle very small prices', () => {
    const propsWithSmallPrice = {
      ...mockProductProps,
      price: 0.99,
      originalPrice: 1.50
    };

    const { getByText } = render(
      <ProductCard {...propsWithSmallPrice} />
    );

    expect(getByText('$0.99')).toBeTruthy();
    expect(getByText('$1.50')).toBeTruthy();
  });

  it('should handle high prices', () => {
    const propsWithHighPrice = {
      ...mockProductProps,
      price: 99.99,
      originalPrice: 150.00
    };

    const { getByText } = render(
      <ProductCard {...propsWithHighPrice} />
    );

    expect(getByText('$99.99')).toBeTruthy();
    expect(getByText('$150.00')).toBeTruthy();
  });

  it('should handle multiple press events', () => {
    const mockOnPress = jest.fn();
    
    const { getByRole } = render(
      <ProductCard {...mockProductProps} onPress={mockOnPress} />
    );

    const card = getByRole('button');
    
    fireEvent.press(card);
    fireEvent.press(card);
    fireEvent.press(card);
    
    expect(mockOnPress).toHaveBeenCalledTimes(3);
  });

  it('should render with different image sources', () => {
    const propsWithLocalImage = {
      ...mockProductProps,
      image: require('@/assets/icon.png') // Using a local asset
    };

    const { getByRole } = render(
      <ProductCard {...propsWithLocalImage} />
    );

    expect(getByRole('button')).toBeTruthy();
  });
});
