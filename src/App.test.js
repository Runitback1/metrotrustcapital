import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders MetroTrust branding during app startup', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/metrotrust capital/i)).toBeInTheDocument();
  });
});
