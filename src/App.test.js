import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MetroTrust branding during app startup', () => {
  render(<App />);
  expect(screen.getByText(/metrotrust capital/i)).toBeInTheDocument();
});
