import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import { axiosApiInstanceAuth, setStore } from "../api/axios";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import ReportModal from "./ReportModal";

const authMock = new MockAdapter(axiosApiInstanceAuth);

function renderModal(props: Partial<React.ComponentProps<typeof ReportModal>> = {}, loggedIn = true) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile() : null);
  setStore(store as any);
  return renderWithProviders(
    <ReportModal isOpen targetType="POST" targetId="42" onClose={vi.fn()} {...props} />,
    store as any,
  );
}

beforeEach(() => {
  authMock.reset();
});

describe("ReportModal — visibility", () => {
  it("renders nothing when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText("Report post")).not.toBeInTheDocument();
  });

  it("shows a login prompt instead of the form when logged out", () => {
    renderModal({}, false);
    expect(screen.getByText("You need to be logged in to report content.")).toBeInTheDocument();
    expect(screen.queryByText("Spam or misleading")).not.toBeInTheDocument();
  });
});

describe("ReportModal — reason list per target type", () => {
  it("shows post-specific reasons for POST", () => {
    renderModal({ targetType: "POST" });
    expect(screen.getByText("Illegal or prohibited listing")).toBeInTheDocument();
  });

  it("shows comment-specific reasons for COMMENT (no illegal-listing option)", () => {
    renderModal({ targetType: "COMMENT" });
    expect(screen.queryByText("Illegal or prohibited listing")).not.toBeInTheDocument();
    expect(screen.getByText("Spam or misleading")).toBeInTheDocument();
  });

  it("shows profile-specific reasons for PROFILE", () => {
    renderModal({ targetType: "PROFILE" });
    expect(screen.getByText("Inappropriate display name")).toBeInTheDocument();
  });
});

describe("ReportModal — submission flow", () => {
  it("disables Submit Report until a reason is selected", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Submit Report" })).toBeDisabled();
    fireEvent.click(screen.getByText("Spam or misleading"));
    expect(screen.getByRole("button", { name: "Submit Report" })).not.toBeDisabled();
  });

  it("reveals the optional note field only after a reason is picked", () => {
    renderModal();
    expect(screen.queryByPlaceholderText(/Any additional details/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Spam or misleading"));
    expect(screen.getByPlaceholderText(/Any additional details/)).toBeInTheDocument();
  });

  it("submits without an additionalNote field when the note is blank", async () => {
    authMock.onPost("/reports").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body).toEqual({ targetType: "POST", targetId: "42", reason: "SPAM" });
      return [200];
    });
    renderModal();
    fireEvent.click(screen.getByText("Spam or misleading"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });

  it("includes a trimmed additionalNote when provided", async () => {
    authMock.onPost("/reports").reply((config) => {
      const body = JSON.parse(config.data);
      expect(body.additionalNote).toBe("more context");
      return [200];
    });
    renderModal();
    fireEvent.click(screen.getByText("Spam or misleading"));
    fireEvent.change(screen.getByPlaceholderText(/Any additional details/), { target: { value: "  more context  " } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));
    await waitFor(() => expect(authMock.history.post.length).toBe(1));
  });

  it("shows the success state after a successful submission", async () => {
    authMock.onPost("/reports").reply(200);
    renderModal();
    fireEvent.click(screen.getByText("Spam or misleading"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));
    await screen.findByText("Report submitted");
  });

  it("shows a specific message when the report is a duplicate (409)", async () => {
    authMock.onPost("/reports").reply(409);
    renderModal();
    fireEvent.click(screen.getByText("Spam or misleading"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));
    await screen.findByText("You've already reported this. Our team will review it.");
  });

  it("shows a generic error for any other failure", async () => {
    authMock.onPost("/reports").reply(500);
    renderModal();
    fireEvent.click(screen.getByText("Spam or misleading"));
    fireEvent.click(screen.getByRole("button", { name: "Submit Report" }));
    await screen.findByText("Something went wrong. Please try again.");
  });
});

describe("ReportModal — close behavior", () => {
  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(document.querySelector(".bg-black\\/60")!);
    expect(onClose).toHaveBeenCalled();
  });
});
