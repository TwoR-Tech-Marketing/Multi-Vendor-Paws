"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { listBranches } from "@/features/branches/application/branches.api";
import { listMyVendorReviews, replyToReview } from "@/features/reviews/application/reviews.api";
import { mapReviewError } from "@/features/reviews/domain/errors";
import { applyReply } from "@/features/reviews/domain/list-state";
import {
  REVIEW_LIMITS,
  type ReviewFilter,
  type VendorReview,
} from "@/features/reviews/domain/types";
import { ReplyDialog } from "@/features/reviews/presentation/ReplyDialog";
import {
  ReviewsFilters,
  type ReviewBranchOption,
} from "@/features/reviews/presentation/ReviewsFilters";
import { ReviewsList } from "@/features/reviews/presentation/ReviewsList";
import { ReviewListSkeleton, ReviewsSkeleton } from "@/features/reviews/presentation/ReviewsSkeleton";
import { reviewErrorMessage } from "@/features/reviews/presentation/reviews-copy";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";

type ListState = { items: VendorReview[]; nextCursor: string | null };
type Query = { filter: ReviewFilter; branchId: string };

export function ReviewsSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.reviews;

  const [query, setQuery] = useState<Query>({ filter: "all", branchId: "" });
  const [branches, setBranches] = useState<ReviewBranchOption[]>([]);
  const [list, setList] = useState<ListState | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<LoadErrorView | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<VendorReview | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const requestRef = useRef(0);

  const load = useCallback(
    async (current: Query) => {
      const id = ++requestRef.current;
      setIsListLoading(true);
      try {
        const page = await listMyVendorReviews({
          filter: current.filter,
          branchId: current.branchId || undefined,
          pageSize: REVIEW_LIMITS.pageSize,
        });
        if (id !== requestRef.current) return;
        setList(page);
        setError(null);
      } catch (loadError) {
        if (id === requestRef.current) setError(toLoadErrorView(loadError, strings, t.loadError));
      } finally {
        if (id === requestRef.current) setIsListLoading(false);
      }
    },
    [strings, t.loadError],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(query), 0);
    return () => window.clearTimeout(timer);
  }, [query, load]);

  useEffect(() => {
    let cancelled = false;
    listBranches({ includeArchived: true })
      .then((items) => {
        if (!cancelled) setBranches(items.map((b) => ({ branchId: b.branchId, name: b.name })));
      })
      .catch(() => {
        // The branch filter stays at "All branches"; the list still loads.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    if (!list?.nextCursor) return;
    const id = requestRef.current;
    setIsLoadingMore(true);
    try {
      const page = await listMyVendorReviews({
        filter: query.filter,
        branchId: query.branchId || undefined,
        pageSize: REVIEW_LIMITS.pageSize,
        cursor: list.nextCursor,
      });
      if (id !== requestRef.current) return;
      setList((prev) => ({ items: [...(prev?.items ?? []), ...page.items], nextCursor: page.nextCursor }));
    } catch (loadError) {
      setError(toLoadErrorView(loadError, strings, reviewErrorMessage(loadError, strings)));
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function submitReply(text: string) {
    if (!replyTarget) return;
    setIsReplying(true);
    setReplyError(null);
    try {
      const updated = await replyToReview(replyTarget.appointmentId, text);
      setList((prev) =>
        prev ? { ...prev, items: applyReply(prev.items, replyTarget.appointmentId, updated, text) } : prev,
      );
      setReplyTarget(null);
      setSuccess(t.reply.success);
    } catch (replyFailure) {
      setReplyError(reviewErrorMessage(replyFailure, strings));
      if (mapReviewError(replyFailure) === "alreadyReplied") {
        // A reply already exists on the server, so the action is hidden.
        setList((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((item) =>
                  item.appointmentId === replyTarget.appointmentId ? { ...item, canReply: false } : item,
                ),
              }
            : prev,
        );
      }
    } finally {
      setIsReplying(false);
    }
  }

  if (!list && isListLoading) return <ReviewsSkeleton />;

  const hasRows = (list?.items.length ?? 0) > 0;

  return (
    <div className={branchStyles.stack}>
      {error && hasRows ? (
        <LoadErrorState view={error} strings={strings} onRetry={() => void load(query)} compact />
      ) : null}
      {success ? (
        <div className={branchStyles.alertSuccess} role="status">
          {success}
        </div>
      ) : null}
      <section className={branchStyles.panel} aria-label={t.title}>
        <ReviewsFilters
          filter={query.filter}
          branchId={query.branchId}
          branches={branches}
          strings={strings}
          onFilterChange={(filter) => setQuery((q) => ({ ...q, filter }))}
          onBranchChange={(branchId) => setQuery((q) => ({ ...q, branchId }))}
        />
        {isListLoading ? (
          <ReviewListSkeleton />
        ) : error && !hasRows ? (
          <LoadErrorState view={error} strings={strings} onRetry={() => void load(query)} />
        ) : list ? (
          <ReviewsList
            items={list.items}
            strings={strings}
            locale={locale}
            hasMore={list.nextCursor !== null}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void loadMore()}
            onReply={(review) => {
              setSuccess(null);
              setReplyError(null);
              setReplyTarget(review);
            }}
          />
        ) : null}
      </section>
      {replyTarget ? (
        <ReplyDialog
          strings={strings}
          isSubmitting={isReplying}
          error={replyError}
          onConfirm={(text) => void submitReply(text)}
          onClose={() => setReplyTarget(null)}
        />
      ) : null}
    </div>
  );
}
