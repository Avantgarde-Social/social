import { LightBulbIcon } from "@heroicons/react/24/outline";
import { useCallback, useMemo } from "react";
import SinglePost from "@/components/Post/SinglePost";
import PostFeed from "@/components/Shared/Post/PostFeed";
import {
  PageSize,
  type PostFragment,
  type PostsForYouRequest,
  type PostsRequest,
  PostType,
  usePostsForYouQuery,
  usePostsQuery
} from "@/indexer/generated";

const forYouRequest: PostsForYouRequest = {
  pageSize: PageSize.Fifty,
  shuffle: true
};

const fallbackRequest: PostsRequest = {
  filter: { postTypes: [PostType.Root, PostType.Quote] },
  pageSize: PageSize.Fifty
};

const ForYou = () => {
  const { data, error, fetchMore, loading } = usePostsForYouQuery({
    context: { skipAuth: true },
    variables: { request: forYouRequest }
  });

  const forYouItems = data?.mlPostsForYou.items;
  const postIds = useMemo(
    () => (forYouItems ?? []).map((item) => item.post.id).slice(-50),
    [forYouItems]
  );

  usePostsQuery({
    skip: postIds.length === 0,
    variables: {
      request: { filter: { posts: postIds }, pageSize: PageSize.Fifty }
    }
  });

  const {
    data: fallbackData,
    error: fallbackError,
    fetchMore: fetchMoreFallback,
    loading: fallbackLoading
  } = usePostsQuery({
    skip: !error,
    variables: { request: fallbackRequest }
  });

  const useFallback = Boolean(error);
  const pageInfo = useFallback
    ? fallbackData?.posts.pageInfo
    : data?.mlPostsForYou.pageInfo;
  const hasMore = pageInfo?.next;
  const activeLoading = useFallback
    ? fallbackLoading || (!fallbackData && !fallbackError)
    : loading;
  const activeError = useFallback ? fallbackError : undefined;

  const handleEndReached = useCallback(async () => {
    if (!hasMore) {
      return;
    }

    if (useFallback) {
      await fetchMoreFallback({
        variables: { request: { ...fallbackRequest, cursor: pageInfo?.next } }
      });
      return;
    }

    await fetchMore({
      context: { skipAuth: true },
      variables: { request: { ...forYouRequest, cursor: pageInfo?.next } }
    });
  }, [fetchMore, fetchMoreFallback, hasMore, pageInfo?.next, useFallback]);

  const filteredPosts = useMemo(() => {
    if (useFallback) {
      return (fallbackData?.posts.items ?? []).filter(
        (post): post is PostFragment =>
          post.__typename === "Post" &&
          !post.author.operations?.hasBlockedMe &&
          !post.author.operations?.isBlockedByMe &&
          !post.operations?.hasReported
      );
    }

    return (forYouItems ?? [])
      .map((item) => item.post)
      .filter(
        (post) =>
          !post.author.operations?.hasBlockedMe &&
          !post.author.operations?.isBlockedByMe &&
          !post.operations?.hasReported
      );
  }, [fallbackData?.posts.items, forYouItems, useFallback]);

  return (
    <PostFeed
      emptyIcon={<LightBulbIcon className="size-8" />}
      emptyMessage="No posts yet!"
      error={activeError}
      errorTitle="Failed to load for you"
      handleEndReached={handleEndReached}
      hasMore={hasMore}
      items={filteredPosts}
      loading={activeLoading}
      renderItem={(post) => <SinglePost key={post.id} post={post} />}
    />
  );
};

export default ForYou;
