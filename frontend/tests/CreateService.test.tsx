import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateServicePage from "@/app/create-service/page";
import { useUserStore } from "@/stores/userStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { mocked } from "jest-mock";
import toast from "react-hot-toast";
import { createService, fetchCategories } from "@/api/services/servicesApi";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/api/services/servicesApi", () => ({
  fetchCategories: jest.fn().mockResolvedValue([
    { id: "cat1", name: "Plumbing" },
    { id: "cat2", name: "Electrician" },
  ]),
  createService: jest.fn(),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: jest.fn(),
}));

const push = jest.fn();
const replace = jest.fn();
mocked(useRouter).mockReturnValue({
  push,
  replace,
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
});

const queryClient = new QueryClient();

describe("CreateServicePage", () => {
  process.env.NEXT_PUBLIC_TEST_MODE = "true";
  beforeEach(() => {
    jest.clearAllMocks();
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      user: { role: "PROVIDER" },
      accessToken: "mockAccessToken",
    });
  });

  it("renders form fields", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateServicePage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Create a New Service")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Service/i })
    ).toBeInTheDocument();
  });
  describe("Form and Creating service tests", () => {
    it("should create a service successfully", async () => {
      (createService as jest.Mock).mockResolvedValue({
        data: {
          service: {
            id: "service1",
            title: "Test Service for testing blah blah",
            description: "Test description blah blah blah ....",
            categoryId: "cat1",
            price: 100,
            image: "test-image.jpg",
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );

      const titleInput = screen.getByLabelText(/Title/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const imageInput = screen.getByLabelText(/image/i);

      await waitFor(() => {
        const categorySelect = screen.getByLabelText(/Category/i);
        expect(categorySelect.children.length).toBeGreaterThan(1);
      });

      const categorySelect = screen.getByLabelText(/Category/i);

      const file = new File(["test-image"], "test-image.jpg", {
        type: "image/jpeg",
      });
      await userEvent.type(titleInput, "Test Service for testing blah blah");
      await userEvent.type(
        descriptionInput,
        "Test description blah blah blah ...."
      );
      await userEvent.selectOptions(categorySelect, "cat1");
      await userEvent.type(priceInput, "100");
      await userEvent.upload(imageInput, file);
      await userEvent.click(
        screen.getByRole("button", { name: /Create Service/i })
      );
      const form = screen.getByTestId("create-service-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(createService).toHaveBeenCalledWith({
          title: "Test Service for testing blah blah",
          description: "Test description blah blah blah ....",
          categoryId: "cat1",
          price: "100",
          image: expect.any(File),
        });
        expect(toast.success).toHaveBeenCalledWith("Service created!");
        expect(push).toHaveBeenCalledWith("/services");
      });
    });
    it("should not submit form if required fields are missing", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );

      await userEvent.click(
        screen.getByRole("button", { name: /Create Service/i })
      );

      const form = screen.getByTestId("create-service-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(createService).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should show error toast if service creation fails", async () => {
      (createService as jest.Mock).mockRejectedValue(
        new Error("Internal Server Error")
      );

      render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );

      const titleInput = screen.getByLabelText(/Title/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const priceInput = screen.getByLabelText(/Price/i);
      const imageInput = screen.getByLabelText(/image/i);
      const categorySelect = screen.getByLabelText(/Category/i);

      const file = new File(["test-image"], "test-image.jpg", {
        type: "image/jpeg",
      });

      await userEvent.type(titleInput, "My Service");
      await userEvent.type(descriptionInput, "Description");
      await userEvent.selectOptions(categorySelect, "cat1");
      await userEvent.type(priceInput, "99");
      await userEvent.upload(imageInput, file);

      const form = screen.getByTestId("create-service-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to create service");
      });
    });
  });

  describe("Categories tests", () => {
    it("should display categories in select when fetchCategories succeeds", async () => {
      const mockCategories = [
        { id: "cat1", name: "Plumbing" },
        { id: "cat2", name: "Electrician" },
      ];

      (fetchCategories as jest.Mock).mockResolvedValue(mockCategories);
      render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );
      await waitFor(() => {
        const option = screen.getByRole("option", { name: /Plumbing/i });
        expect(option).toBeInTheDocument();
      });

      const select = screen.getByLabelText(/Category/i);
      expect(select.children.length).toBeGreaterThan(1);
    });

    it("should display error message when fetchCategories fails", async () => {
      mocked(fetchCategories).mockRejectedValue(new Error("Failed to fetch"));

      render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(
          screen.findByRole("heading", {
            name: /Error fetching categories\. Please try again\./i,
            level: 1,
          })
        ).resolves.toBeInTheDocument();
      });
    });
  });
  describe("Authorization tests", () => {
    it("should not allow submission if accessToken is missing", async () => {
      (useUserStore as unknown as jest.Mock).mockReturnValue({
        user: { role: "PROVIDER" },
        accessToken: null,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );

      const form = screen.getByTestId("create-service-form");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(createService).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith("Not authenticated.");
      });
    });

    it(" should return null if user is not logged in", () => {
      (useUserStore as unknown as jest.Mock).mockReturnValue({ user: null });

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );
      expect(container.innerHTML).toBe("");
    });

    it("should redirect to '/' if user is not a PROVIDER", async () => {
      (useUserStore as unknown as jest.Mock).mockReturnValue({
        user: { role: "CLIENT" },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <CreateServicePage />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(replace).toHaveBeenCalledWith("/");
      });
    });
  });
});
