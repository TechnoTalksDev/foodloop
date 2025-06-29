import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should combine class names correctly', () => {
      const result = cn('btn', 'btn-primary');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('btn', isActive && 'active');
      expect(result).toBeTruthy();
    });

    it('should handle empty or undefined values', () => {
      const result = cn('btn', null, undefined, '');
      expect(result).toBeTruthy();
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBeTruthy();
      // Should favor the last px-4 over px-2
      expect(result).toContain('px-4');
      expect(result).not.toContain('px-2');
    });

    it('should handle complex class combinations', () => {
      const result = cn(
        'flex items-center justify-center',
        'bg-blue-500 hover:bg-blue-600',
        'text-white font-semibold',
        'px-4 py-2 rounded'
      );
      expect(result).toBeTruthy();
      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('bg-blue-500');
    });
  });
});
