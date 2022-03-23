import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders App', async () => {
  render(<App />);
  const linkElement = screen.getByText(/Anmelden/i);

  await waitFor(() => {
    expect(linkElement).toBeInTheDocument();
  });
});
