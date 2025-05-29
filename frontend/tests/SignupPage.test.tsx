import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "../src/app/auth/signup/page";
import { handleSignup } from "../src/api/auth/authApi";
import { useRouter } from "next/navigation";
import { mocked } from "jest-mock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Global Mocks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/api/auth/authApi", () => ({
  handleSignup: jest.fn(),
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

describe("SignupPage", () => {
  it("should render all input fields and submit the form", async () => {
    (handleSignup as jest.Mock).mockResolvedValue({
      data: { accessToken: "fake-token", user: { username: "Ali" } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SignupPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "Ali" },
    });
    expect(screen.getByLabelText(/name/i)).toHaveValue("Ali");

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ali@example.com" },
    });
    expect(screen.getByLabelText(/email/i)).toHaveValue("ali@example.com");
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("12345678");
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "12345678" },
    });
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue("12345678");
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: "CLIENT" },
    });
    expect(screen.getByLabelText(/role/i)).toHaveValue("CLIENT");
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(handleSignup).toHaveBeenCalledWith({
        username: "Ali",
        email: "ali@example.com",
        password: "12345678",
        confirmPassword: "12345678",
        role: "CLIENT",
      });
      expect(mockSetUser).toHaveBeenCalled();
      expect(mockSetAccessToken).toHaveBeenCalled();
      expect(mockConnect).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/");
    });
  });

  it("should show error if passwords don't match", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SignupPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "Ali" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ali@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "87654321" },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: "CLIENT" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
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

    (handleSignup as jest.Mock).mockRejectedValue(errorResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <SignupPage />
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "Ali" },
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "invalid@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: "CLIENT" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must be at least 6 characters"
      );
    });
  });
  it("should show toast error when User already exists", async () => {
    const errorResponse = {
      response: {
        data: {
          error: "User already exists",
        },
      },
    };

    (handleSignup as jest.Mock).mockRejectedValue(errorResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <SignupPage />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "Ali" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: "CLIENT" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("User already exists");
    });
  });
  it("should show generic error message on unknown error", async () => {
    (handleSignup as jest.Mock).mockRejectedValue({});

    render(
      <QueryClientProvider client={queryClient}>
        <SignupPage />
      </QueryClientProvider>
    );
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "Ali" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "any@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: "CLIENT" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong. Please try again."
      );
    });
  });
  it("should toggle password visibility when clicking the eye icon", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <SignupPage />
      </QueryClientProvider>
    );

    const passwordInput = screen.getByLabelText("Password");
    const toggleButton = screen.getByRole("button", {
      name: /toggle password visibility/i,
    });

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });
  it("should reset the form after signup attempt (onSettled)", async () => {
    (handleSignup as jest.Mock).mockResolvedValue({
      data: { accessToken: "fake-token", user: { username: "Ali" } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SignupPage />
      </QueryClientProvider>
    );
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const roleInput = screen.getByLabelText(/role/i);

    fireEvent.change(usernameInput, { target: { value: "Ali" } });
    fireEvent.change(emailInput, { target: { value: "ali@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "12345678" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "12345678" } });
    fireEvent.change(roleInput, { target: { value: "CLIENT" } });

    fireEvent.click(screen.getByRole("button", { name: /Sign Up/i }));

    await waitFor(() => {
      expect(usernameInput).toHaveValue("");
      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
      expect(confirmPasswordInput).toHaveValue("");
      expect(roleInput).toHaveValue("");
      expect(toast.success).toHaveBeenCalledWith("Signup successful!");
    });
  });
});
