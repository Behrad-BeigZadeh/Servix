import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../src/app/auth/login/page";
import { handleLogin } from "../src/api/auth/authApi";
import { useRouter } from "next/navigation";
import { mocked } from "jest-mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Global Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/api/auth/authApi", () => ({
  handleLogin: jest.fn(),
}));

const mockSetUser = jest.fn();
const mockSetAccessToken = jest.fn();

jest.mock("@/stores/userStore", () => ({
  useUserStore: jest.fn(() => ({
    setUser: mockSetUser,
    setAccessToken: mockSetAccessToken,
  })),
}));

const mockConnect = jest.fn();

jest.mock("@/stores/socketStore", () => ({
  useSocketStore: {
    getState: () => ({
      connect: mockConnect,
    }),
  },
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));
const queryClient = new QueryClient();

const push = jest.fn();
mocked(useRouter).mockReturnValue({
  push,
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
});

describe("LoginPage", () => {
  it("should render all input fields and submit the form", async () => {
    (handleLogin as jest.Mock).mockResolvedValue({
      data: { accessToken: "fake-token", user: { username: "Ali" } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ali@example.com" },
    });
    expect(screen.getByLabelText(/email/i)).toHaveValue("ali@example.com");

    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("12345678");
    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));
    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledWith({
        email: "ali@example.com",
        password: "12345678",
      });
      expect(mockSetUser).toHaveBeenCalled();
      expect(mockSetAccessToken).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/");
    });
  });
  it("should show toast errors when API returns an array of validation errors", async () => {
    const errorResponse = {
      response: {
        data: {
          error: [{ message: "Password must be at least 6 characters" }],
        },
      },
    };

    (handleLogin as jest.Mock).mockRejectedValue(errorResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "invalid@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must be at least 6 characters"
      );
    });
  });
  it("should show toast error when API returns a string error", async () => {
    const errorResponse = {
      response: {
        data: {
          error: "Invalid credentials",
        },
      },
    };

    (handleLogin as jest.Mock).mockRejectedValue(errorResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });
  it("should show generic error message on unknown error", async () => {
    (handleLogin as jest.Mock).mockRejectedValue({});

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "any@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong. Please try again."
      );
    });
  });
  it("should toggle password visibility when clicking the eye icon", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    const passwordInput = screen.getByPlaceholderText("••••••••");
    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });
  it("should reset the form after login attempt (onSettled)", async () => {
    (handleLogin as jest.Mock).mockResolvedValue({
      data: { accessToken: "fake-token", user: { username: "Ali" } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    fireEvent.change(emailInput, { target: { value: "ali@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "12345678" } });

    fireEvent.click(screen.getByRole("button", { name: /Log In/i }));

    await waitFor(() => {
      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
      expect(toast.success).toHaveBeenCalledWith("Login successful!");
    });
  });
});
