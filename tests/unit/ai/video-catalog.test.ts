import { describe, expect, test } from 'vitest';
import { creditsConfig } from '../../../config/credits';
import { calculateVideoCreditCost, getAliyunResolution } from '@libs/ai';

describe('Wan 3.0 catalog fixes', () => {
  test('Prime costs more credits than Standard', () => {
    const aiVideo = creditsConfig.fixedConsumption.aiVideo;
    if (typeof aiVideo === 'number') {
      throw new Error('aiVideo must be a per-model map');
    }

    const standard = aiVideo.models?.['wan3.0-video'];
    const prime = aiVideo.models?.['wan3.0-video-prime'];

    expect(standard).toBeDefined();
    expect(prime).toBeDefined();
    expect(prime!).toBeGreaterThan(standard!);
  });

  test('calculateVideoCreditCost ranks Prime above Standard', () => {
    const standard = calculateVideoCreditCost({ provider: 'aliyun', model: 'wan3.0-video' });
    const prime = calculateVideoCreditCost({ provider: 'aliyun', model: 'wan3.0-video-prime' });

    expect(prime).toBeGreaterThan(standard);
  });

  test('getAliyunResolution maps square 1080 to 1080P', () => {
    expect(getAliyunResolution('1080*1080')).toBe('1080P');
    expect(getAliyunResolution('1080x1080')).toBe('1080P');
  });

  test('getAliyunResolution maps 16:9 and 9:16 1080 sizes to 1080P', () => {
    expect(getAliyunResolution('1920*1080')).toBe('1080P');
    expect(getAliyunResolution('1080*1920')).toBe('1080P');
    expect(getAliyunResolution('1920x1080')).toBe('1080P');
    expect(getAliyunResolution('1080x1920')).toBe('1080P');
  });

  test('getAliyunResolution maps 720 sizes to 720P', () => {
    expect(getAliyunResolution('1280*720')).toBe('720P');
    expect(getAliyunResolution('720*1280')).toBe('720P');
    expect(getAliyunResolution('1280x720')).toBe('720P');
    expect(getAliyunResolution('720x1280')).toBe('720P');
  });

  test('getAliyunResolution maps 480 sizes to 480P', () => {
    expect(getAliyunResolution('854*480')).toBe('480P');
    expect(getAliyunResolution('480x854')).toBe('480P');
  });
});
