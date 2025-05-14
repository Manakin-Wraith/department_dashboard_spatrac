/**
 * Unit tests for supplierIngredientUtils.js
 */

const { 
  normalizeDepartmentCode, 
  extractIngredientInfo, 
  createSearchableText,
  findSupplierForIngredient
} = require('./supplierIngredientUtils');

describe('normalizeDepartmentCode', () => {
  test('normalizes numeric department codes', () => {
    expect(normalizeDepartmentCode('1154')).toBe('BAKERY');
    expect(normalizeDepartmentCode('1152')).toBe('BUTCHERY');
    expect(normalizeDepartmentCode('1155')).toBe('HMR');
  });

  test('normalizes department names', () => {
    expect(normalizeDepartmentCode('bakery')).toBe('BAKERY');
    expect(normalizeDepartmentCode('BUTCHERY')).toBe('BUTCHERY');
    expect(normalizeDepartmentCode('hmr')).toBe('HMR');
  });

  test('returns default for unknown department', () => {
    expect(normalizeDepartmentCode('unknown')).toBe('BUTCHERY');
    expect(normalizeDepartmentCode('')).toBe('BUTCHERY');
    expect(normalizeDepartmentCode(null)).toBe('BUTCHERY');
  });
});

describe('extractIngredientInfo', () => {
  test('extracts code from ingredient description', () => {
    expect(extractIngredientInfo('TEST INGREDIENT (123)')).toEqual({
      code: '123',
      description: 'TEST INGREDIENT'
    });
  });

  test('handles ingredient without code', () => {
    expect(extractIngredientInfo('TEST INGREDIENT')).toEqual({
      code: null,
      description: 'TEST INGREDIENT'
    });
  });

  test('handles empty input', () => {
    expect(extractIngredientInfo('')).toEqual({
      code: null,
      description: ''
    });
    expect(extractIngredientInfo(null)).toEqual({
      code: null,
      description: ''
    });
  });
});

describe('createSearchableText', () => {
  test('converts text to lowercase', () => {
    expect(createSearchableText('TEST')).toBe('test');
  });

  test('removes special characters', () => {
    expect(createSearchableText('TEST-123')).toBe('test 123');
  });

  test('handles empty input', () => {
    expect(createSearchableText('')).toBe('');
    expect(createSearchableText(null)).toBe('');
  });
});

describe('findSupplierForIngredient', () => {
  // Mock data for testing
  const mockData = [
    {
      supplier_code: '120',
      supplier_name: 'WESTERN CAPE MILLING',
      supplier_product_code: 'WBMIX',
      'ing.prod_code': 'WBMIX',
      ean: '6009667010210',
      product_description: 'W/CAPE MILL  MIX WHT BRD',
      pack_size: '9.5KG',
      department: 'BAKERY'
    },
    {
      supplier_code: '16',
      supplier_name: 'CHIPKINS PURATOS (BIDVEST SOL)',
      supplier_product_code: '13720',
      'ing.prod_code': '13720',
      ean: '',
      product_description: 'YEAST WET',
      pack_size: 'P/KG',
      department: 'BAKERY'
    },
    {
      supplier_code: '806',
      supplier_name: 'AIRPORT INTERNATIONAL TRADING',
      supplier_product_code: 'VAC',
      'ing.prod_code': '28863',
      ean: '',
      product_description: 'VAC CROPS 90/10',
      pack_size: 'P/KG',
      department: 'BUTCHERY'
    },
    {
      supplier_code: '23',
      supplier_name: 'FAMPAK PACKAGING DISTRIBUTORS',
      supplier_product_code: '700026',
      'ing.prod_code': '32191',
      ean: '',
      product_description: 'SHERIFF BOEREWORS SPICES',
      pack_size: 'P/KG',
      department: 'BUTCHERY'
    }
  ];

  test('finds supplier by exact ingredient code match', () => {
    const result = findSupplierForIngredient('WBMIX', 'BAKERY', mockData);
    expect(result).toBeTruthy();
    expect(result.name).toBe('WESTERN CAPE MILLING');
    expect(result.supplier_code).toBe('120');
  });

  test('finds supplier by product description', () => {
    const result = findSupplierForIngredient('W/CAPE MILL  MIX WHT BRD', 'BAKERY', mockData);
    expect(result).toBeTruthy();
    expect(result.name).toBe('WESTERN CAPE MILLING');
  });

  test('finds supplier across departments when ignoreDepartment is true', () => {
    const result = findSupplierForIngredient('SHERIFF BOEREWORS SPICES', 'BAKERY', mockData, { ignoreDepartment: true });
    expect(result).toBeTruthy();
    expect(result.name).toBe('FAMPAK PACKAGING DISTRIBUTORS');
    expect(result.supplier_code).toBe('23');
  });

  test('returns null for unknown ingredient', () => {
    const result = findSupplierForIngredient('UNKNOWN INGREDIENT', 'BAKERY', mockData);
    expect(result).toBeNull();
  });

  test('handles empty input', () => {
    expect(findSupplierForIngredient('', 'BAKERY', mockData)).toBeNull();
    expect(findSupplierForIngredient(null, 'BAKERY', mockData)).toBeNull();
    expect(findSupplierForIngredient('WBMIX', '', mockData)).toBeTruthy(); // Should default to BUTCHERY
    expect(findSupplierForIngredient('WBMIX', 'BAKERY', [])).toBeNull();
    expect(findSupplierForIngredient('WBMIX', 'BAKERY', null)).toBeNull();
  });
});
