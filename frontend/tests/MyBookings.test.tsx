import { render, screen, waitFor, fireEvent } from "@testing-library/react";

import { useUserStore } from "@/stores/userStore";
import { getBookings } from "@/api/bookings/bookingsApi";
import { startOrGetChatRoom } from "@/api/chat/chatApi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import toast from "react-hot-toast";
import MyBookings from "@/app/bookings/my-bookings/page";
import { AxiosError, AxiosHeaders } from "axios";

// Mock stores and API
jest.mock("@/stores/userStore", () => ({
  useUserStore: jest.fn(),
}));
jest.mock("@/api/bookings/bookingsApi", () => ({
  getBookings: jest.fn(),
}));
jest.mock("@/api/chat/chatApi", () => ({
  startOrGetChatRoom: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockAccessToken = "mock-token";

const sampleBooking = {
  id: "booking-1",
  date: "2025-05-27",
  status: "ACCEPTED",
  service: {
    id: "service-1",
    title: "Mock Service",
    description: "Test",
    price: 100,
    images: ["test.jpg"],
    provider: {
      id: "provider-1",
      username: "ProviderUser",
    },
  },
  client: {
    id: "client-1",
    username: "ClientUser",
  },
};

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("MyBookings", () => {
  beforeEach(() => {
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      accessToken: mockAccessToken,
    });
    jest.clearAllMocks();
  });

  it("renders loading spinner initially", async () => {
    (getBookings as jest.Mock).mockReturnValue(new Promise(() => {})); // never resolves

    renderWithClient(<MyBookings />);
    const spinner = await screen.findByTestId("spinner");
    expect(spinner).toBeInTheDocument();
  });

  it("renders bookings and allows starting a chat", async () => {
    (getBookings as jest.Mock).mockResolvedValue({ data: [sampleBooking] });
    (startOrGetChatRoom as jest.Mock).mockResolvedValue({
      chatRoom: { id: "room-1" },
    });

    renderWithClient(<MyBookings />);

    await waitFor(() => {
      expect(screen.getByText("Mock Service")).toBeInTheDocument();
    });

    const chatButton = screen.getByRole("button", {
      name: /start chat with provideruser/i,
    });
    expect(chatButton).toBeInTheDocument();

    fireEvent.click(chatButton);

    await waitFor(() => {
      expect(startOrGetChatRoom).toHaveBeenCalledWith(
        "provider-1",
        mockAccessToken
      );
      expect(toast.success).toHaveBeenCalledWith("Chat started!");
    });
  });

  it("handles API error gracefully", async () => {
    const error = new AxiosError(
      "Request failed with status code 401",
      "401",
      undefined,
      undefined,
      {
        data: { error: "Unauthorized" },
        status: 401,
        statusText: "Unauthorized",
        headers: {},
        config: {
          headers: new AxiosHeaders({
            "Content-Type": "application/json",
          }),
          method: "get",
          url: "/fake-url",
        },
      }
    );

    (getBookings as jest.Mock).mockRejectedValue(error);
    renderWithClient(<MyBookings />);

    await waitFor(() => {
      screen.debug();
    });

    const errorEl = await screen.findByTestId("error-message");
    expect(errorEl).toHaveTextContent(/unauthorized/i);
  });

  it("shows empty state if no bookings match selected filter", async () => {
    (getBookings as jest.Mock).mockResolvedValue({ data: [] });

    renderWithClient(<MyBookings />);

    await waitFor(() => {
      expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
    });
  });
});
