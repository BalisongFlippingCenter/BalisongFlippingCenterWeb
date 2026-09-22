import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { Post } from "../modals/Post";
import ProfilePost from "./ProfilePost";

const basePost: Post = {
  id: "post-1",
  caption: null,
  description: null,
  creatorId: "u1",
  creatorName: "user1",
  creationDate: "2024-01-01",
  files: [],
  comments: [],
  likes: 0,
  identifier: null,
  isPrivate: false,
  isAnnouncement: false,
  hasTimer: false,
  timerValue: null,
};

describe("ProfilePost", () => {
  it("renders the post's id", () => {
    render(<ProfilePost postObj={basePost} />);
    expect(screen.getByText("post-1")).toBeInTheDocument();
  });
});
