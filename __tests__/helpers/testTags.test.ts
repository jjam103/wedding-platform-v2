/**
 * Tests for Test Tagging System
 */

import {
  getTagsFromTestName,
  hasTag,
  hasAnyTag,
  hasAllTags,
  type TestTag,
} from './testTags';

describe('Test Tagging System', () => {
  describe('getTagsFromTestName', () => {
    it('should extract single tag from test name', () => {
      const testName = 'should create guest @tag:unit';
      const tags = getTagsFromTestName(testName);
      
      expect(tags).toEqual(['unit']);
    });
    
    it('should extract multiple tags from test name', () => {
      const testName = 'should create guest @tag:unit @tag:fast @tag:critical';
      const tags = getTagsFromTestName(testName);
      
      expect(tags).toEqual(['unit', 'fast', 'critical']);
    });
    
    it('should return empty array for test with no tags', () => {
      const testName = 'should create guest';
      const tags = getTagsFromTestName(testName);
      
      expect(tags).toEqual([]);
    });
    
    it('should handle tags in middle of test name', () => {
      const testName = 'should @tag:unit create @tag:fast guest';
      const tags = getTagsFromTestName(testName);
      
      expect(tags).toEqual(['unit', 'fast']);
    });
  });
  
  describe('hasTag', () => {
    it('should return true when test has tag', () => {
      const testName = 'should create guest @tag:unit @tag:fast';
      
      expect(hasTag(testName, 'unit')).toBe(true);
      expect(hasTag(testName, 'fast')).toBe(true);
    });
    
    it('should return false when test does not have tag', () => {
      const testName = 'should create guest @tag:unit';
      
      expect(hasTag(testName, 'slow')).toBe(false);
      expect(hasTag(testName, 'integration')).toBe(false);
    });
  });
  
  describe('hasAnyTag', () => {
    it('should return true when test has any of the tags', () => {
      const testName = 'should create guest @tag:unit @tag:fast';
      
      expect(hasAnyTag(testName, ['unit', 'slow'])).toBe(true);
      expect(hasAnyTag(testName, ['fast', 'integration'])).toBe(true);
    });
    
    it('should return false when test has none of the tags', () => {
      const testName = 'should create guest @tag:unit';
      
      expect(hasAnyTag(testName, ['slow', 'integration'])).toBe(false);
    });
  });
  
  describe('hasAllTags', () => {
    it('should return true when test has all tags', () => {
      const testName = 'should create guest @tag:unit @tag:fast @tag:critical';
      
      expect(hasAllTags(testName, ['unit', 'fast'])).toBe(true);
      expect(hasAllTags(testName, ['unit', 'fast', 'critical'])).toBe(true);
    });
    
    it('should return false when test is missing some tags', () => {
      const testName = 'should create guest @tag:unit @tag:fast';
      
      expect(hasAllTags(testName, ['unit', 'fast', 'critical'])).toBe(false);
      expect(hasAllTags(testName, ['unit', 'slow'])).toBe(false);
    });
  });
});
