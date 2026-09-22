import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/renderWithProviders";
import { makeTestStore, makeProfile } from "../test/testStore";
import CommentInput from "./CommentInput";

function renderInput(props: Partial<React.ComponentProps<typeof CommentInput>> = {}, loggedIn = true) {
  const store = makeTestStore(loggedIn ? "tok" : null, loggedIn ? makeProfile() : null);
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  return { onSubmit, ...renderWithProviders(<CommentInput onSubmit={onSubmit} {...props} />, store as any) };
}

describe("CommentInput — logged out", () => {
  it("shows a login prompt instead of the input", () => {
    renderInput({}, false);
    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Write a comment...")).not.toBeInTheDocument();
  });
});

describe("CommentInput — posting", () => {
  it("hides the Post button until there is content", () => {
    renderInput();
    expect(screen.queryByRole("button", { name: "Post" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Write a comment..."), { target: { value: "hi" } });
    expect(screen.getByRole("button", { name: "Post" })).toBeInTheDocument();
  });

  it("submits the trimmed content and clears the field", async () => {
    const { onSubmit } = renderInput();
    fireEvent.change(screen.getByPlaceholderText("Write a comment..."), { target: { value: "  hello  " } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("hello"));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Post" })).not.toBeInTheDocument());
  });

  it("does not submit whitespace-only content", () => {
    const { onSubmit } = renderInput();
    fireEvent.change(screen.getByPlaceholderText("Write a comment..."), { target: { value: "   " } });
    expect(screen.queryByRole("button", { name: "Post" })).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits via Cmd/Ctrl+Enter", async () => {
    const { onSubmit } = renderInput();
    const textarea = screen.getByPlaceholderText("Write a comment...");
    fireEvent.change(textarea, { target: { value: "quick submit" } });
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("quick submit"));
  });

  it("shows an error toast and keeps the content when submission fails with a server message", async () => {
    const store = makeTestStore("tok", makeProfile());
    const onSubmit = vi.fn().mockRejectedValue({ response: { data: "Comment blocked." } });
    renderWithProviders(<CommentInput onSubmit={onSubmit} />, store as any);
    fireEvent.change(screen.getByPlaceholderText("Write a comment..."), { target: { value: "bad word" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Comment blocked." }));
    expect(screen.getByPlaceholderText("Write a comment...")).toHaveValue("bad word");
  });

  it("shows a generic error toast when the server gives no message", async () => {
    const store = makeTestStore("tok", makeProfile());
    const onSubmit = vi.fn().mockRejectedValue(new Error("network down"));
    renderWithProviders(<CommentInput onSubmit={onSubmit} />, store as any);
    fireEvent.change(screen.getByPlaceholderText("Write a comment..."), { target: { value: "hi" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() =>
      expect(store.getState().uiToast.toasts[0]).toMatchObject({ type: "error", message: "Failed to post comment. Please try again." }),
    );
  });
});

describe("CommentInput — cancel", () => {
  it("shows Cancel only when onCancel is provided, and calls it on click", () => {
    const onCancel = vi.fn();
    renderInput({ onCancel });
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("hides Cancel when onCancel is not provided", () => {
    renderInput();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });
});

describe("CommentInput — initial value", () => {
  it("prefills the textarea from initialValue (edit mode)", () => {
    renderInput({ initialValue: "existing comment" });
    expect(screen.getByPlaceholderText("Write a comment...")).toHaveValue("existing comment");
  });
});
