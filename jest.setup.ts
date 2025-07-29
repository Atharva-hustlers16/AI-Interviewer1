import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock SpeechRecognition
if (!('webkitSpeechRecognition' in window)) {
    (window as any).webkitSpeechRecognition = jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
        onend: jest.fn(),
        onresult: jest.fn(),
        onerror: jest.fn(),
        onstart: jest.fn(),
    }));
}
