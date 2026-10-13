import { useParams } from "react-router-dom";
import { useAppSelector } from "../redux/hooks";
import UsersCollectionPageComponent from "../components/collectionPageComponents/UsersCollectionPageComponent";
import PublicCollectionPageComponent from "../components/collectionPageComponents/PublicCollectionPageComponent";
import { usePageMeta } from "../hooks/usePageMeta";

const UserCollectionPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const { account, identifier } = useParams();
  usePageMeta({
    title: `${account}'s Collection`,
    description: `The balisong knives and trainers in ${account}'s collection.`,
  });

  const isOwnCollection =
    !!user &&
    user.displayName === account &&
    user.identifierCode === identifier;

  if (isOwnCollection) {
    return <UsersCollectionPageComponent />;
  }

  return (
    <PublicCollectionPageComponent
      displayName={account!}
      identifierCode={identifier!}
    />
  );
};

export default UserCollectionPage;
