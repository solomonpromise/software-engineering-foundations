import { createFileRoute } from "@tanstack/react-router";
import { feedbackStatus, submitFeedback } from "@/lib/community/feedback.server";

export const Route = createFileRoute("/api/community-feedback")({
  server: {
    handlers: {
      GET: () => feedbackStatus(),
      POST: ({ request }) => submitFeedback(request),
    },
  },
});
