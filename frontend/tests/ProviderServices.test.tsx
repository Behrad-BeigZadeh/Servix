import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProviderServices from "@/app/services/my-services/page";
import { useUserStore } from "@/stores/userStore";
import { getProviderServices } from "@/api/services/servicesApi";
import { useRouter } from "next/navigation";

// Mocks
jest.mock("@/stores/userStore", () => ({
  useUserStore: jest.fn(),
}));

jest.mock("@/api/services/servicesApi", () => ({
  getProviderServices: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("ProviderServices Component", () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace,
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  function renderComponent() {
    const queryClient = createQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <ProviderServices />
      </QueryClientProvider>
    );
  }

  it("redirects to '/' if user is not a PROVIDER", async () => {
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      user: { id: "123", role: "CLIENT" },
      accessToken: "mockToken",
    });

    (getProviderServices as jest.Mock).mockResolvedValue({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/");
    });
  });

  it("shows loading spinner when fetching services", () => {
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      user: { id: "123", role: "PROVIDER" },
      accessToken: "mockToken",
    });

    // Return a Promise that never resolves to simulate loading
    (getProviderServices as jest.Mock).mockReturnValue(new Promise(() => {}));

    renderComponent();

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders fetched services", async () => {
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      user: { id: "user-id", role: "PROVIDER", username: "Test User" },
      accessToken: "fake-token",
    });

    (getProviderServices as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          id: "1",
          title: "Test Service",
          description: "Test description",
          category: "Electrician",
          provider: { username: "ProviderUser" },
          price: 100,
          images: ["test-image.jpg"],
        },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Test Service/i)).toBeInTheDocument();
    });
  });

  it("displays error message if fetch fails", async () => {
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      user: { id: "user-id", role: "PROVIDER" },
      accessToken: "fake-token",
    });

    (getProviderServices as jest.Mock).mockRejectedValueOnce({
      response: {
        data: {
          error: "Failed to fetch services",
        },
      },
    });

    renderComponent();

    expect(
      await screen.findByText(/Error: Failed to fetch services/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Something Went Wrong/i)).toBeInTheDocument();
  });
});
