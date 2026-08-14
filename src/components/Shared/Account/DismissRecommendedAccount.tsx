import { useApolloClient } from "@apollo/client";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@/components/Shared/UI";
import {
  type AccountFragment,
  useMlDismissRecommendedAccountsMutation
} from "@/indexer/generated";

interface DismissRecommendedAccountProps {
  account: AccountFragment;
}

const DismissRecommendedAccount = ({
  account
}: DismissRecommendedAccountProps) => {
  const client = useApolloClient();
  const [dismissRecommendedAccount, { loading }] =
    useMlDismissRecommendedAccountsMutation({
      variables: { request: { accounts: [account.address] } }
    });

  const handleDismiss = async () => {
    umami.track("dismiss_recommendation");
    client.cache.evict({ id: client.cache.identify(account) });
    client.cache.gc();
    await dismissRecommendedAccount().catch(() => undefined);
  };

  return (
    <button disabled={loading} onClick={handleDismiss} type="reset">
      {loading ? (
        <Spinner size="xs" />
      ) : (
        <XMarkIcon className="size-4 text-gray-500" />
      )}
    </button>
  );
};

export default DismissRecommendedAccount;
