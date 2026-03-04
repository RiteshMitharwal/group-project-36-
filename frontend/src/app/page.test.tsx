import { render, screen } from "@testing-library/react";
import HomePage from "./page";

jest.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

describe("HomePage", () => {
  it("renders login form when not authenticated", () => {
    render(<HomePage />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
