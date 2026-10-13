import { useParams } from "react-router-dom";
import { useAppSelector } from "../redux/hooks";
import UsersCollectionKnifeDisplay from "../components/collectionKnifePageComponents/UsersCollectionKnifeDisplay";
import CollectionKnifeDisplay from "../components/collectionKnifePageComponents/CollectionKnifeDisplay";
import { usePageMeta } from "../hooks/usePageMeta";

const CollectionKnifePage = () => {
  const { account, identifier, knife } = useParams();
  usePageMeta({
    title: `${knife} — ${account}'s Collection`,
    description: `${knife} in ${account}'s balisong collection: photos, specs, and notes.`,
  });

  const user = useAppSelector((state) => state.auth.user);
  const collectionKnives = useAppSelector(
    (state) => state.collection.collectionKnives
  );

  if (
    account == user?.displayName &&
    user?.identifierCode == identifier &&
    collectionKnives.find((obj) => {
      return obj.displayName == knife;
    })
  ) {
    return <UsersCollectionKnifeDisplay />;
  } else {
    return <CollectionKnifeDisplay />;
  }
};

export default CollectionKnifePage;
